import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  createGoogleUser,
  linkGoogleToUser
  } from '@/app/lib/data';
export async function POST(request: NextRequest) {
  try {
    const { email, name, image, googleId } = await request.json();
    console.log("BODY:", { email, name, image, googleId });

    console.log("Processing Google user:", email);

    // Buscar si el usuario ya existe por email
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // Usuario existe - vincular cuenta de Google si no está vinculada
      if (!existingUser.google_id) {
        const updatedUser = await linkGoogleToUser(
          existingUser.id,
          googleId,
          name,
          image
        );
        console.log(`Linked Google account to existing user: ${email}`);
        return NextResponse.json({ success: true, user: updatedUser });
      } else {
        console.log(`User already has Google linked: ${email}`);
        return NextResponse.json({ success: true, user: existingUser });
      }
    } else {
      // Usuario no existe - crear nuevo usuario
      const newUser = await createGoogleUser({
        email,
        name: name || "Usuario Google",
        image_url: image,
        google_id: googleId,
      });

      if (newUser) {
        console.log(`Created new Google user: ${email}`);
        return NextResponse.json({ success: true, user: newUser });
      } else {
        return NextResponse.json(
          { success: false, error: "Failed to create user" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error handling Google user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
