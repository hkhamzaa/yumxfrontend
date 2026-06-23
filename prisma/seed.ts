import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const ADMIN_EMAIL = 'admin@yumxfastfood.com'
const ADMIN_PASSWORD = 'YumX@Admin123'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedCategory(slug: string, name: string, displayOrder: number) {
  const result = await prisma.menuCategory.upsert({
    where: { slug },
    create: { name, slug, displayOrder, isActive: true },
    update: {},
  })
  return result
}

async function seedItem(
  categoryId: string,
  name: string,
  variants: Array<{ label: string; price: number }>,
): Promise<{ itemCreated: boolean; variantsCreated: number }> {
  let item = await prisma.menuItem.findFirst({ where: { name, categoryId } })
  const itemCreated = !item

  if (!item) {
    item = await prisma.menuItem.create({
      data: {
        name,
        description: null,
        imageUrl: null,
        categoryId,
        isAvailable: true,
        isFeatured: false,
      },
    })
  }

  let variantsCreated = 0
  for (const v of variants) {
    const exists = await prisma.menuItemVariant.findFirst({
      where: { menuItemId: item.id, label: v.label },
    })
    if (!exists) {
      await prisma.menuItemVariant.create({
        data: { menuItemId: item.id, label: v.label, price: v.price },
      })
      variantsCreated++
    }
  }

  return { itemCreated, variantsCreated }
}

async function seedDeal(
  dealNumber: string,
  title: string,
  description: string,
  price: number,
  displayOrder: number,
): Promise<boolean> {
  const exists = await prisma.comboDeal.findFirst({ where: { dealNumber } })
  if (!exists) {
    await prisma.comboDeal.create({
      data: { dealNumber, title, description, price, imageUrl: null, isActive: true, displayOrder },
    })
    return true
  }
  return false
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Site content ──────────────────────────────────────────────────────────
  await prisma.siteContent.upsert({
    where: { key: 'delivery_fee' },
    create: { key: 'delivery_fee', value: '100' },
    update: {},
  })
  console.log('✓ Seeded: delivery_fee = 100')

  // ── Admin user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, passwordHash, role: 'SUPERADMIN' },
    update: {},
  })
  console.log(`✓ Seeded: admin user — ${ADMIN_EMAIL} (role: SUPERADMIN)`)
  console.log('  ⚠  Change the admin password after first login.')

  // ── Categories ────────────────────────────────────────────────────────────
  console.log('\nSeeding categories…')

  const catChickenBurger  = await seedCategory('burgers-chicken',    'Burgers (Chicken)',      1)
  const catBeefBurger     = await seedCategory('burgers-beef',       'Burgers (Beef)',          2)
  const catShawarma       = await seedCategory('shawarma-platters',  'Shawarma & Platters',     3)
  const catWraps          = await seedCategory('wraps',              'Wraps',                   4)
  const catStrips         = await seedCategory('zinger-strips',      'Zinger Strips',           5)
  const catWings          = await seedCategory('hot-wings',          'Hot Wings',               6)
  const catNuggets        = await seedCategory('nuggets',            'Nuggets',                 7)
  const catFries          = await seedCategory('salted-fries',       'Salted Fries',            8)
  const catPizza          = await seedCategory('deep-pan-pizza',     'Deep Pan Pizza',          9)
  const catFriedChicken   = await seedCategory('fried-chicken',      'Fried Chicken',          10)
  const catLoadedFries    = await seedCategory('loaded-fries',       'Loaded Fries',           11)
  const catDrinks         = await seedCategory('drinks',             'Drinks',                 12)

  // ── Menu items ────────────────────────────────────────────────────────────
  console.log('Seeding menu items…')

  let totalItems = 0
  let totalVariants = 0

  async function add(
    categoryId: string,
    name: string,
    variants: Array<{ label: string; price: number }>,
  ) {
    const r = await seedItem(categoryId, name, variants)
    if (r.itemCreated) totalItems++
    totalVariants += r.variantsCreated
  }

  // ── Burgers (Chicken) ────────────────────────────────────────────────────
  await add(catChickenBurger.id, 'Zinger Classic',         [{ label: 'Regular', price: 350 }])
  await add(catChickenBurger.id, 'Chicken Classic',        [{ label: 'Regular', price: 300 }])
  await add(catChickenBurger.id, 'Zinger X Special Burger',[{ label: 'Regular', price: 550 }])
  await add(catChickenBurger.id, 'Zinger Mighty X Burger', [{ label: 'Regular', price: 600 }])

  // ── Burgers (Beef) ───────────────────────────────────────────────────────
  await add(catBeefBurger.id, 'Beef X Classic', [{ label: 'Regular', price: 550 }])
  await add(catBeefBurger.id, 'Mighty X Beef',  [{ label: 'Regular', price: 700 }])

  // ── Shawarma & Platters ───────────────────────────────────────────────────
  await add(catShawarma.id, 'Large Shawarma',        [{ label: 'Regular', price: 300 }])
  await add(catShawarma.id, 'Special Shawarma',      [{ label: 'Regular', price: 350 }])
  await add(catShawarma.id, 'Zinger Shawarma',       [{ label: 'Regular', price: 400 }])
  await add(catShawarma.id, 'Classic Platter',       [{ label: 'Regular', price: 550 }])
  await add(catShawarma.id, 'YUM X Special Platter', [{ label: 'Regular', price: 650 }])

  // ── Wraps ─────────────────────────────────────────────────────────────────
  await add(catWraps.id, 'Chicken Wrap', [{ label: 'Regular', price: 400 }])
  await add(catWraps.id, 'Zinger Wrap',  [{ label: 'Regular', price: 450 }])

  // ── Zinger Strips ─────────────────────────────────────────────────────────
  await add(catStrips.id, 'Zinger Strips', [
    { label: '5 PCS',  price: 400 },
    { label: '10 PCS', price: 700 },
  ])

  // ── Hot Wings ─────────────────────────────────────────────────────────────
  await add(catWings.id, 'Hot Wings', [
    { label: '5 PCS',  price: 320 },
    { label: '10 PCS', price: 600 },
  ])

  // ── Nuggets ───────────────────────────────────────────────────────────────
  await add(catNuggets.id, 'Nuggets', [
    { label: '5 PCS',  price: 320 },
    { label: '10 PCS', price: 600 },
  ])

  // ── Salted Fries ──────────────────────────────────────────────────────────
  await add(catFries.id, 'Salted Fries', [
    { label: 'Regular', price: 200 },
    { label: 'Large',   price: 380 },
  ])

  // ── Deep Pan Pizza ────────────────────────────────────────────────────────
  await add(catPizza.id, 'Chicken Tikka', [
    { label: 'Small',  price:  550 },
    { label: 'Medium', price: 1000 },
    { label: 'Large',  price: 1300 },
  ])
  await add(catPizza.id, 'Chicken Fajita', [
    { label: 'Small',  price:  550 },
    { label: 'Medium', price: 1000 },
    { label: 'Large',  price: 1300 },
  ])
  await add(catPizza.id, 'Chicken Supreme', [
    { label: 'Small',  price:  600 },
    { label: 'Medium', price: 1050 },
    { label: 'Large',  price: 1350 },
  ])
  await add(catPizza.id, 'Cheese Lover', [
    { label: 'Small',  price:  525 },
    { label: 'Medium', price:  950 },
    { label: 'Large',  price: 1250 },
  ])
  await add(catPizza.id, 'Vegi Delight', [
    { label: 'Small',  price:  550 },
    { label: 'Medium', price: 1000 },
    { label: 'Large',  price: 1300 },
  ])
  await add(catPizza.id, 'YUM X Special', [
    { label: 'Small',  price:  600 },
    { label: 'Medium', price: 1100 },
    { label: 'Large',  price: 1400 },
  ])

  // ── Fried Chicken ─────────────────────────────────────────────────────────
  await add(catFriedChicken.id, 'Fried Chicken', [
    { label: '1 PC',   price:  250 },
    { label: '3 PCS',  price:  700 },
    { label: '5 PCS',  price: 1100 },
    { label: '10 PCS', price: 2100 },
  ])

  // ── Loaded Fries ──────────────────────────────────────────────────────────
  await add(catLoadedFries.id, 'Tikka Loaded Fries', [
    { label: 'Regular', price: 450 },
    { label: 'Large',   price: 550 },
  ])
  await add(catLoadedFries.id, 'Zinger Loaded Fries', [
    { label: 'Regular', price: 550 },
    { label: 'Large',   price: 650 },
  ])

  // ── Drinks ────────────────────────────────────────────────────────────────
  await add(catDrinks.id, 'Soft Drink', [
    { label: '345ml',       price:  80 },
    { label: 'Half Litre',  price: 120 },
    { label: '1.5 Litre',   price: 220 },
    { label: '2.25 Litre',  price: 260 },
  ])
  await add(catDrinks.id, 'Mineral Water', [
    { label: 'Small', price:  60 },
    { label: 'Large', price: 100 },
  ])

  // ── Combo Deals ───────────────────────────────────────────────────────────
  console.log('Seeding combo deals…')

  let totalDeals = 0

  async function deal(num: string, title: string, desc: string, price: number) {
    const created = await seedDeal(num, title, desc, price, parseInt(num, 10))
    if (created) totalDeals++
  }

  await deal('01', 'Deal 01', '1 Zinger Burger + Regular Fries + Half Litre Drink',                                          650)
  await deal('02', 'Deal 02', '1 Zinger Burger + 1 Regular Fries + 1 Half Litre Drink + 1 PC Chicken',                       850)
  await deal('03', 'Deal 03', '1 Chicken Burger + 1 Regular Fries + 1 Half Litre Drink',                                      600)
  await deal('04', 'Deal 04', '1 Chicken Wrap + 1 Regular Fries + 1 Half Litre Drink',                                        700)
  await deal('05', 'Deal 05', '3 PCS Chicken + 1 Half Litre Drink',                                                           750)
  await deal('06', 'Deal 06', '10 PCS Hot Wings + 1 Half Litre Drink',                                                        700)
  await deal('07', 'Deal 07', '4 Large Shawarma + 1.5 Litre Drink',                                                          1400)
  await deal('08', 'Deal 08', '3 Zinger Burger + 1 Chicken Burger + 1.5 Litre Drink + 2 Large Fries',                       2250)
  await deal('09', 'Deal 09', '6 Special Shawarma + 1.5 Litre Drink',                                                        2280)
  await deal('10', 'Deal 10', '6 Zinger Burger + 1.5 Litre Drink',                                                           2270)
  await deal('11', 'Deal 11', '5 Large Shawarma + 3 Zinger Burger + 2 Large Fries + 1.5 Litre Drink',                       3400)
  await deal('12', 'Deal 12', '8 Chicken PCS + 3 Zinger Burger + 2 Large Fries + 2.25 Litre Drink',                         3600)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────────')
  console.log('  YUM X Menu Seed — Summary')
  console.log('────────────────────────────────────────')
  console.log(`  Categories created / updated : 12 upserted`)
  console.log(`  Items created (new)          : ${totalItems}`)
  console.log(`  Variants created (new)       : ${totalVariants}`)
  console.log(`  Combo deals created (new)    : ${totalDeals}`)
  console.log('────────────────────────────────────────')
  console.log('  Re-running is safe — no duplicates.\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
