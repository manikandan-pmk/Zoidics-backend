import { NextRequest, NextResponse } from "next/server";

import { Testimonial } from "../../../../entities/Testimonial";

import { connectDatabase } from "../../../../lib/database";

import {
    mkdir,
    unlink,
    writeFile,
} from "fs/promises";

import path from "path";

import { randomUUID } from "crypto";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

function getImageExtension(file: File) {
    const extensions: Record<string, string> = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
    };

    return extensions[file.type] || null;
}

function createSafeFileName(
    name: string
) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

async function deleteLocalImage(
    imageUrl: string | null
) {
    if (
        !imageUrl ||
        !imageUrl.startsWith(
            "/uploads/testimonials/"
        )
    ) {
        return;
    }

    const filePath = path.join(
        process.cwd(),
        "public",
        imageUrl.replace(
            /^\/+/,
            ""
        )
    );

    try {
        await unlink(filePath);
    } catch (error) {
        console.warn(
            "IMAGE DELETE WARNING:",
            error
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET /api/testimonials/:id
|--------------------------------------------------------------------------
*/

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } =
            await context.params;

        const testimonialId =
            Number(id);

        if (
            !Number.isInteger(
                testimonialId
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid testimonial ID",
                },
                {
                    status: 400,
                }
            );
        }

        const database =
            await connectDatabase();

        const repository =
            database.getRepository(
                Testimonial
            );

        const testimonial =
            await repository.findOne({
                where: {
                    id: testimonialId,
                },
            });

        if (!testimonial) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Testimonial not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            testimonial,
        });
    } catch (error) {
        console.error(
            "GET TESTIMONIAL ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to fetch testimonial",
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            {
                status: 500,
            }
        );
    }
}

/*
|--------------------------------------------------------------------------
| PUT /api/testimonials/:id
|--------------------------------------------------------------------------
*/

export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } =
            await context.params;

        const testimonialId =
            Number(id);

        if (
            !Number.isInteger(
                testimonialId
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid testimonial ID",
                },
                {
                    status: 400,
                }
            );
        }

        const database =
            await connectDatabase();

        const repository =
            database.getRepository(
                Testimonial
            );

        const testimonial =
            await repository.findOne({
                where: {
                    id: testimonialId,
                },
            });

        if (!testimonial) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Testimonial not found",
                },
                {
                    status: 404,
                }
            );
        }

        const formData =
            await request.formData();

        const nameValue =
            formData.get("name");

        const roleValue =
            formData.get("role");

        const companyValue =
            formData.get("company");

        const messageValue =
            formData.get("message");

        const imageValue =
            formData.get("image");

        const isPublishedValue =
            formData.get("isPublished");

        const displayOrderValue =
            formData.get("displayOrder");

        /*
        |--------------------------------------------------------------------------
        | Text fields
        |--------------------------------------------------------------------------
        */

        if (
            typeof nameValue === "string"
        ) {
            const name =
                nameValue.trim();

            if (!name) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Name cannot be empty.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            testimonial.name = name;
        }

        if (
            typeof roleValue === "string"
        ) {
            testimonial.role =
                roleValue.trim() || null;
        }

        if (
            typeof companyValue === "string"
        ) {
            testimonial.company =
                companyValue.trim() || null;
        }

        if (
            typeof messageValue ===
            "string"
        ) {
            const message =
                messageValue.trim();

            if (!message) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Message cannot be empty.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            testimonial.message =
                message;
        }

        if (
            typeof isPublishedValue ===
            "string"
        ) {
            testimonial.isPublished =
                isPublishedValue === "true";
        }

        if (
            typeof displayOrderValue ===
            "string"
        ) {
            testimonial.displayOrder =
                Number(
                    displayOrderValue
                ) || 0;
        }

        /*
        |--------------------------------------------------------------------------
        | New image
        |--------------------------------------------------------------------------
        */

        if (
            imageValue instanceof File &&
            imageValue.size > 0
        ) {
            const MAX_FILE_SIZE =
                5 * 1024 * 1024;

            if (
                imageValue.size >
                MAX_FILE_SIZE
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Image size must be less than 5MB.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const extension =
                getImageExtension(
                    imageValue
                );

            if (!extension) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Only PNG, JPG and WEBP images are allowed.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const uploadDirectory =
                path.join(
                    process.cwd(),
                    "public",
                    "uploads",
                    "testimonials"
                );

            await mkdir(
                uploadDirectory,
                {
                    recursive: true,
                }
            );

            const safeName =
                createSafeFileName(
                    testimonial.name
                );

            const fileName =
                `${safeName}-${randomUUID()}${extension}`;

            const filePath =
                path.join(
                    uploadDirectory,
                    fileName
                );

            const bytes =
                await imageValue.arrayBuffer();

            await writeFile(
                filePath,
                Buffer.from(bytes)
            );

            /*
            |--------------------------------------------------------------------------
            | Delete old image
            |--------------------------------------------------------------------------
            */

            const oldImage =
                testimonial.imageUrl;

            testimonial.imageUrl =
                `/uploads/testimonials/${fileName}`;

            await deleteLocalImage(
                oldImage
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Save
        |--------------------------------------------------------------------------
        */

        const updatedTestimonial =
            await repository.save(
                testimonial
            );

        return NextResponse.json({
            success: true,
            message:
                "Testimonial updated successfully",
            testimonial:
                updatedTestimonial,
        });
    } catch (error) {
        console.error(
            "UPDATE TESTIMONIAL ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to update testimonial",
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            {
                status: 500,
            }
        );
    }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/testimonials/:id
|--------------------------------------------------------------------------
*/

export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } =
            await context.params;

        const testimonialId =
            Number(id);

        if (
            !Number.isInteger(
                testimonialId
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid testimonial ID",
                },
                {
                    status: 400,
                }
            );
        }

        const database =
            await connectDatabase();

        const repository =
            database.getRepository(
                Testimonial
            );

        const testimonial =
            await repository.findOne({
                where: {
                    id: testimonialId,
                },
            });

        if (!testimonial) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Testimonial not found",
                },
                {
                    status: 404,
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Delete database record
        |--------------------------------------------------------------------------
        */

        await repository.remove(
            testimonial
        );

        /*
        |--------------------------------------------------------------------------
        | Delete related image
        |--------------------------------------------------------------------------
        */

        await deleteLocalImage(
            testimonial.imageUrl
        );

        return NextResponse.json({
            success: true,
            message:
                "Testimonial deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE TESTIMONIAL ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to delete testimonial",
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            {
                status: 500,
            }
        );
    }
}