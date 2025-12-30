// "use server";

// import { db } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { revalidatePath } from "next/cache";

// /**
//  * Sets the user's role and related information
//  */
// export async function setUserRole(formData) {
//   const { userId } = await auth();

//   if (!userId) {
//     console.warn("Onboarding: unauthorized access to setUserRole");
//     throw new Error("Unauthorized");
//   }

//   // Find user in our database
//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found in database");

//   const role = formData.get("role");

//   if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
//     throw new Error("Invalid role selection");
//   }

//   try {
//     // For patient role - simple update
//     if (role === "PATIENT") {
//       await db.user.update({
//         where: {
//           clerkUserId: userId,
//         },
//         data: {
//           role: "PATIENT",
//         },
//       });

//       revalidatePath("/");
//       return { success: true, redirect: "/doctors" };
//     }

//     // For doctor role - need additional information
//     if (role === "DOCTOR") {
//       const specialty = formData.get("specialty");
//       const phone = formData.get("phone");
//       const qualificationsRaw = formData.get("qualifications");
//       const qualifications = qualificationsRaw
//         ? JSON.parse(qualificationsRaw)
//         : [];

//       const experience = parseInt(formData.get("experience"), 10);
//       const credentialUrl = formData.get("credentialUrl");
//       const description = formData.get("description");

//       // Validate inputs
//       if (
//         !specialty ||
//         !phone ||
//         !qualifications ||
//         !experience ||
//         !credentialUrl ||
//         !description
//       ) {
//         throw new Error("All fields are required");
//       }

//       await db.user.update({
//         where: {
//           clerkUserId: userId,
//         },
//         data: {
//           role: "DOCTOR",
//           specialty,
//           phone,
//           qualifications,

//           experience,
//           credentialUrl,
//           description,
//           verificationStatus: "PENDING",
//         },
//       });

//       revalidatePath("/");
//       return { success: true, redirect: "/doctor/verification" };
//     }
//   } catch (error) {
//     console.error("Failed to set user role:", error);
//     throw new Error(`Failed to update user profile: ${error.message}`);
//   }
// }

// /**
//  * Gets the current user's complete profile information
//  */
// export async function getCurrentUser() {
//   const { userId } = await auth();

//   if (!userId) {
//     return null;
//   }

//   try {
//     const user = await db.user.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     return user;
//   } catch (error) {
//     console.error("Failed to get user information:", error);
//     return null;
//   }
// }

// "use server";

// import { db } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { revalidatePath } from "next/cache";

// export async function setUserRole(formData) {
//   // ✅ auth() must be awaited
//   const { userId } = await auth();

//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   const role = formData.get("role")?.toString();

//   if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
//     throw new Error("Invalid role selected");
//   }

//   try {
//     const user = await db.user.findUnique({
//       where: { clerkUserId: userId },
//     });

//     if (!user) {
//       throw new Error("User not found in database");
//     }

//     // ---------------- PATIENT ----------------
//     if (role === "PATIENT") {
//       await db.user.update({
//         where: { clerkUserId: userId },
//         data: { role: "PATIENT" },
//       });

//       revalidatePath("/");
//       return { success: true, redirect: "/doctors" };
//     }

//     // ---------------- DOCTOR ----------------
//     const specialty = formData.get("specialty")?.toString();
//     const phone = formData.get("phone")?.toString();
//     const credentialUrl = formData.get("credentialUrl")?.toString();
//     const description = formData.get("description")?.toString();

//     let qualifications= [];
//     const rawQualifications = formData.get("qualifications");

//     if (rawQualifications) {
//       try {
//         qualifications = JSON.parse(rawQualifications.toString());
//       } catch {
//         throw new Error("Invalid qualifications format");
//       }
//     }

//     const experience = Number(formData.get("experience"));

//     if (
//       !specialty ||
//       !phone ||
//       !credentialUrl ||
//       !description ||
//       isNaN(experience)
//     ) {
//       throw new Error("All fields are required");
//     }

//     await db.user.update({
//       where: { clerkUserId: userId },
//       data: {
//         role: "DOCTOR",
//         specialty,
//         phone,
//         qualifications,
//         experience,
//         credentialUrl,
//         description,
//         verificationStatus: "PENDING",
//       },
//     });

//     revalidatePath("/");
//     return { success: true, redirect: "/doctor/verification" };
//   } catch (error) {
//     console.error("❌ Onboarding Error:", error);
//     throw new Error("Failed to complete onboarding");
//   }
// }export async function getCurrentUser() {
//   const { userId } = auth(); // NOT await

//   if (!userId) return null;

//   try {
//     const user = await db.user.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });
//     return user;
//   } catch (error) {
//     console.error("Failed to get user information:", error);
//     return null;
//   }
// }
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Ensure DB user exists (Email + Google safe)
 */
async function getOrCreateDbUser(clerkUserId) {
  let user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkUserId,
        role: "PATIENT", // default role
      },
    });
  }

  return user;
}

/**
 * Set user role during onboarding
 */
export async function setUserRole(formData) {
  const { userId } = auth(); // ✅ NEVER await auth()

  // 🔐 Not logged in
  if (!userId) {
    return { success: false, redirect: "/sign-in" };
  }

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    return { success: false, message: "Invalid role selected" };
  }

  try {
    // ✅ Make sure DB user exists
    await getOrCreateDbUser(userId);

    /* ================= PATIENT ================= */
    if (role === "PATIENT") {
      await db.user.update({
        where: { clerkUserId: userId },
        data: { role: "PATIENT" },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    /* ================= DOCTOR ================= */
    const specialty = formData.get("specialty");
    const phone = formData.get("phone");
    const credentialUrl = formData.get("credentialUrl");
    const description = formData.get("description");
    const experience = Number(formData.get("experience"));

    let qualifications = [];
    const rawQualifications = formData.get("qualifications");

    if (rawQualifications) {
      try {
        qualifications = JSON.parse(rawQualifications);
      } catch {
        return {
          success: false,
          message: "Invalid qualifications format",
        };
      }
    }

    if (
      !specialty ||
      !phone ||
      !credentialUrl ||
      !description ||
      isNaN(experience)
    ) {
      return { success: false, message: "All fields are required" };
    }

    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        role: "DOCTOR",
        specialty,
        phone,
        qualifications,
        experience,
        credentialUrl,
        description,
        verificationStatus: "PENDING",
      },
    });

    revalidatePath("/");
    return { success: true, redirect: "/doctor/verification" };
  } catch (error) {
    console.error("❌ Onboarding error:", error);
    return {
      success: false,
      message: "Failed to complete onboarding",
    };
  }
}

/**
 * Get current logged-in user from DB
 */
export async function getCurrentUser() {
  const { userId } = auth(); // ✅ NO await

  if (!userId) return null;

  try {
    return await db.user.findUnique({
      where: { clerkUserId: userId },
    });
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}