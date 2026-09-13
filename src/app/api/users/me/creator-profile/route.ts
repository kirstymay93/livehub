import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { creatorProfileSchema } from "@/lib/validation";

const sanitizeCategories = (categories?: string[]) =>
  Array.from(
    new Set(
      (categories || [])
        .map((category) => category.trim())
        .filter(Boolean)
    )
  ).slice(0, 5);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        creatorProfile: {
          select: {
            displayName: true,
            bio: true,
            categories: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      role: user.role,
      profile: {
        displayName: user.creatorProfile?.displayName || "",
        bio: user.creatorProfile?.bio || "",
        categories: user.creatorProfile?.categories || [],
      },
    });
  } catch (error) {
    console.error("Error fetching creator profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = creatorProfileSchema.safeParse({
      displayName: body.displayName?.trim() || undefined,
      bio: body.bio?.trim() || undefined,
      categories: Array.isArray(body.categories) ? body.categories : [],
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid creator profile" },
        { status: 400 }
      );
    }

    const categories = sanitizeCategories(parsed.data.categories);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          role:
            session.user.role === UserRole.ADMIN
              ? UserRole.ADMIN
              : UserRole.CREATOR,
        },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      const profile = await tx.creatorProfile.upsert({
        where: { userId: user.id },
        update: {
          displayName: parsed.data.displayName || null,
          bio: parsed.data.bio || null,
          categories,
        },
        create: {
          userId: user.id,
          displayName: parsed.data.displayName || null,
          bio: parsed.data.bio || null,
          categories,
        },
        select: {
          displayName: true,
          bio: true,
          categories: true,
        },
      });

      return { user, profile };
    });

    return NextResponse.json({
      role: result.user.role,
      username: result.user.username,
      profile: result.profile,
    });
  } catch (error) {
    console.error("Error saving creator profile:", error);
    return NextResponse.json(
      { error: "Failed to save creator profile" },
      { status: 500 }
    );
  }
}
