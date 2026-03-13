import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  //   Buat toko

  const now = new Date();
  const subscribePlus7 = new Date();
  subscribePlus7.setDate(now.getDate() + 7);
  const toko = await prisma.toko.create({
    data: {
      namaToko: "JAVA CELL",
      alamat: "Indonesia",
      noTelp: "628123456789",
      SubscribeTime: subscribePlus7,
      isActive: true,
    },
  });

  // Buat user
  const user = await prisma.user.create({
    data: {
      nama: "Super Admin",
      email: "admin@javacell.com",
      password: passwordHash,
      role: "Super Admin",
      idToko: toko.id,
      isActive: true,
    },
  });

  console.log("User & toko dibuat");

  // Generate 1000 data keuntungan
  const keuntunganData = [];

  for (let i = 0; i < 180; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    keuntunganData.push({
      idToko: toko.id,
      createdAt: date,
      keuntunganTransaksi: BigInt(randomNumber(10000, 200000)),
      keuntunganVoucherHarian: BigInt(randomNumber(5000, 100000)),
      keuntunganAcc: BigInt(randomNumber(10000, 150000)),
      keuntunganSparepart: BigInt(randomNumber(5000, 80000)),
      keuntunganService: BigInt(randomNumber(10000, 120000)),
      keuntunganGrosirVoucher: BigInt(randomNumber(20000, 200000)),
    });
  }

  await prisma.keuntungan.createMany({
    data: keuntunganData,
  });

  console.log("1000 data dummy Keuntungan berhasil dibuat");

  console.log({
    toko,
    user,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
