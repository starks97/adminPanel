import { PrismaClient } from '@prisma/client';

import fs from 'fs';

import * as bcrypt from 'bcryptjs';
import { SlugGenerator } from 'src/modules/utils';

const prisma = new PrismaClient();

async function main() {
  const OWNER_role = await prisma.role.create({
    data: {
      name: 'OWNER',
      permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  });

  const ADMIN_role = await prisma.role.create({
    data: {
      name: 'ADMIN',
      permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  });

  const PUBLIC_role = await prisma.role.create({
    data: {
      name: 'PUBLIC',
      permissions: ['READ'],
    },
  });

  const OWNER_user = await prisma.user.create({
    data: {
      email: 'david@david.com',
      name: 'David',
      lastName: 'Espinoza',
      password: bcrypt.hashSync('12345678', 10),
      bio: 'I am a developer',
      image: 'https://i.pravatar.cc/300',
      birthday: new Date('1997-12-22'),
      createdAt: new Date(),

      role: {
        connect: {
          name: OWNER_role.name,
        },
      },
    },
  });

  const ADMIN_user = await prisma.user.create({
    data: {
      email: 'samay@samay.com',
      name: 'Samay',
      lastName: 'Cedeno',
      password: bcrypt.hashSync('12345678', 10),
      bio: 'I am fall in love with David',
      image: 'https://i.pravatar.cc/300',
      birthday: new Date('1999-07-12'),
      createdAt: new Date(),

      role: {
        connect: {
          name: ADMIN_role.name,
        },
      },
    },
  });

  const Lorenzo_user = await prisma.user.create({
    data: {
      email: 'lorenzo@public.com',
      name: 'lorenzo',
      lastName: 'Garcia',
      password: bcrypt.hashSync('12345678', 10),
      bio: 'I am a PUBLIC user',
      image: 'https://i.pravatar.cc/300',
      birthday: new Date('1998-07-12'),
      createdAt: new Date(),

      role: {
        connect: {
          name: PUBLIC_role.name,
        },
      },
    },
  });

  const Guillermo_user = await prisma.user.create({
    data: {
      email: 'guillermo@guillermo.com',
      name: 'Guillermo',
      lastName: 'Llanos',
      password: bcrypt.hashSync('12345678', 10),
      bio: 'I am a PUBLIC user',
      image: 'https://i.pravatar.cc/300',
      birthday: new Date('1998-07-12'),
      createdAt: new Date(),

      role: {
        connect: {
          name: PUBLIC_role.name,
        },
      },
    },
  });

  const post1 = await prisma.post.create({
    data: {
      title: 'Post 1',
      slug: SlugGenerator.slugify('Post 1'),
      content: 'Content 1',
      published: true,
      description: 'Description 1',
      createdAt: new Date(),
      updatedAt: new Date(),

      user: {
        connect: {
          id: OWNER_user.id,
        },
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Post 2',
      slug: SlugGenerator.slugify('Post 2'),
      content: 'Content 2',
      published: true,
      description: 'Description 2',
      createdAt: new Date(),
      updatedAt: new Date(),

      user: {
        connect: {
          id: ADMIN_user.id,
        },
      },
    },
  });

  const data = JSON.stringify({
    OWNER_role,
    ADMIN_role,
    PUBLIC_role,
    OWNER_user,
    ADMIN_user,
    Lorenzo_user,
    Guillermo_user,
    post1,
    post2,
  });

  fs.writeFileSync('./seed.json', data);
}
console.log('Seeding...');

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
