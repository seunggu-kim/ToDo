import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. 먼저 팀 생성 (서비스 작동을 위해 필요)
    const team = await prisma.team.upsert({
        where: { name: 'My Local Team' }, // 임시로 이름 기준 (실제는 ID)
        update: {},
        create: {
            name: 'My Local Team',
        },
    });

    // 2. 사용자 생성
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            teamId: team.id,
        },
        create: {
            email,
            name: 'Test User',
            password: hashedPassword,
            teamId: team.id,
        },
    });

    console.log('✅ 테스트 계정 생성 완료!');
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${password}`);
    console.log(`팀 ID: ${team.id}`);
}

main()
    .catch((e) => {
        console.error('❌ 계정 생성 실패:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
