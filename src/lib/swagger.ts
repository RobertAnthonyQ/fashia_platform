import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "FASHIA API",
        version: "1.0.0",
        description:
          "AI-powered professional photo/video generation platform for clothing brands",
      },
      tags: [
        { name: "Profiles", description: "User profile management" },
        { name: "Models", description: "Fashion model management" },
        { name: "Garments", description: "Garment management" },
        { name: "Generations", description: "AI image generation" },
        { name: "Gallery", description: "Generated output gallery" },
        { name: "Credits", description: "Credit management" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
  return spec;
}
