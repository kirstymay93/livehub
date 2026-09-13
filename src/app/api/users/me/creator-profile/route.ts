import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { normalizeCreatorCategories } from "@/lib/creator-profile";
import { prisma } from "@/lib/db";
import { creatorProfileSchema } from "@/lib/validation";

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
    const categories = normalizeCreatorCategories(
      Array.isArray(body.categories) ? body.categories : []
    );
    const activateCreator = body.activateCreator === true;
    const parsed = creatorProfileSchema.safeParse({
      displayName: body.displayName?.trim() || undefined,
      bio: body.bio?.trim() || undefined,
      categories,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid creator profile" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      const nextRole =
        currentUser.role === UserRole.ADMIN
          ? UserRole.ADMIN
          : activateCreator
            ? UserRole.CREATOR
            : currentUser.role;

      const user =
        nextRole === currentUser.role
          ? currentUser
          : await tx.user.update({
              where: { id: currentUser.id },
              data: { role: nextRole },
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
