'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const {
  hero,
  menuCategories,
  menuItems,
  weddingInfo,
  businessInfo,
} = require('../data/inaka-data.json');

async function seedInakaApp() {
  const shouldSeed = await isFirstRun();

  if (shouldSeed) {
    try {
      console.log('Seeding Inaka Coffee data...');
      await importSeedData();
      console.log('Inaka Coffee seed data imported successfully.');
    } catch (error) {
      console.log('Could not import Inaka Coffee seed data');
      console.error(error);
    }
  } else {
    console.log(
      'Inaka Coffee seed data has already been imported. Clear the database to re-seed.'
    );
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const inakaSeedHasRun = await pluginStore.get({ key: 'inakaSeedHasRun' });
  await pluginStore.set({ key: 'inakaSeedHasRun', value: true });
  return !inakaSeedHasRun;
}

async function setPublicPermissions(newPermissions) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  return stats['size'];
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    });
}

async function checkFileExistsBeforeUpload(fileName) {
  const fileWhereName = await strapi.query('plugin::upload.file').findOne({
    where: { name: fileName.replace(/\..*$/, '') },
  });

  if (fileWhereName) {
    return fileWhereName;
  }

  const fileData = getFileData(fileName);
  const fileNameNoExtension = fileName.split('.').shift();
  const [file] = await uploadFile(fileData, fileNameNoExtension);
  return file;
}

async function checkMultipleFilesBeforeUpload(fileNames) {
  const files = [];
  for (const fileName of fileNames) {
    const file = await checkFileExistsBeforeUpload(fileName);
    files.push(file);
  }
  return files;
}

async function importHero() {
  console.log('  Seeding hero...');
  const backgroundImage = await checkFileExistsBeforeUpload(hero.backgroundImage);

  await strapi.documents('api::hero.hero').create({
    data: {
      headline: hero.headline,
      subheadline: hero.subheadline,
      backgroundImage,
    },
  });
}

async function importMenuCategories() {
  console.log('  Seeding menu categories...');
  const categoryIds = {};

  for (const category of menuCategories) {
    const created = await strapi.documents('api::menu-category.menu-category').create({
      data: {
        name: category.name,
        slug: category.slug,
        order: category.order,
      },
    });
    categoryIds[category.slug] = created.documentId;
  }

  return categoryIds;
}

async function importMenuItems(categoryIds) {
  console.log('  Seeding menu items...');

  for (const item of menuItems) {
    const image = await checkFileExistsBeforeUpload(item.image);
    const categoryDocumentId = categoryIds[item.categorySlug];

    await strapi.documents('api::menu-item.menu-item').create({
      data: {
        name: item.name,
        price: item.price,
        description: item.description,
        image,
        category: categoryDocumentId,
        publishedAt: new Date().toISOString(),
      },
    });
  }
}

async function importWeddingInfo() {
  console.log('  Seeding wedding info...');
  const galleryImages = await checkMultipleFilesBeforeUpload(weddingInfo.galleryImages);

  await strapi.documents('api::wedding-info.wedding-info').create({
    data: {
      title: weddingInfo.title,
      description: weddingInfo.description,
      capacity: weddingInfo.capacity,
      facilities: weddingInfo.facilities,
      galleryImages,
    },
  });
}

async function importBusinessInfo() {
  console.log('  Seeding business info...');

  await strapi.documents('api::business-info.business-info').create({
    data: {
      whatsappNumber: businessInfo.whatsappNumber,
      whatsappMessage: businessInfo.whatsappMessage,
      mapEmbedUrl: businessInfo.mapEmbedUrl,
      normalHours: businessInfo.normalHours,
      ramadanHours: businessInfo.ramadanHours,
    },
  });
}

async function importSeedData() {
  await setPublicPermissions({
    hero: ['find', 'findOne'],
    'menu-category': ['find', 'findOne'],
    'menu-item': ['find', 'findOne'],
    'wedding-info': ['find', 'findOne'],
    'business-info': ['find', 'findOne'],
  });

  await importHero();
  const categoryIds = await importMenuCategories();
  await importMenuItems(categoryIds);
  await importWeddingInfo();
  await importBusinessInfo();
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedInakaApp();
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
