import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pc = await prisma.computer.upsert({
    where: { id: "seed-pc" },
    update: {},
    create: {
      id: "seed-pc",
      name: "Example Gaming PC",
      cpu: "AMD Ryzen 7 7800X3D",
      gpu: "NVIDIA RTX 4090",
      ramGb: 32,
      os: "Windows 11",
    },
  });

  const game = await prisma.game.upsert({
    where: { steamAppId: 1091500 },
    update: {},
    create: {
      name: "Cyberpunk 2077",
      platform: "STEAM",
      steamAppId: 1091500,
    },
  });

  await prisma.settingsProfile.upsert({
    where: {
      gameId_computerId_targetResolution_targetFps: {
        gameId: game.id,
        computerId: pc.id,
        targetResolution: "3840x2160",
        targetFps: 120,
      },
    },
    update: {},
    create: {
      gameId: game.id,
      computerId: pc.id,
      targetResolution: "3840x2160",
      targetFps: 120,
      source: "CURATED",
      settings: {
        system: {
          "Power Plan": "Balanced",
          "Hardware GPU Scheduling": "On",
          VRR: "On",
        },
        gpuSoftware: {
          App: "NVIDIA App",
          "DLSS Override": "Off",
        },
        inGame: {
          Preset: "Ultra (customized)",
          "Ray Tracing": "Off",
          Upscaler: "DLSS Performance",
          "Frame Generation": "On",
          "Texture Quality": "High",
        },
      },
      notes: "Example seed data, replace with real curated profiles.",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
