/**
 * prisma/assign-images.ts
 * One-time utility: uploads local images from public/images/ to Cloudinary
 * and writes the returned secure_url into the matching MenuItem / ComboDeal row.
 *
 * Run:  npx tsx prisma/assign-images.ts
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { prisma } from '../lib/prisma'

// ─── Cloudinary config ────────────────────────────────────────────────────────

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.error('❌  Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in env.')
  process.exit(1)
}

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')
const FOLDER     = 'yumx/menu'

// ─── Mapping ──────────────────────────────────────────────────────────────────

type ItemTarget = { kind: 'item';  name: string; categorySlug: string }
type DealTarget = { kind: 'deal';  dealNumber: string }
type Target     = ItemTarget | DealTarget

interface Mapping {
  file: string
  targets: Target[]
  // human note surfaced in the log when one image covers multiple records
  note?: string
}

const MAPPING: Mapping[] = [
  // ── Burgers (Chicken) ──────────────────────────────────────────────────────
  { file: 'zinger-classic-burger.jpeg',   targets: [{ kind: 'item', name: 'Zinger Classic',         categorySlug: 'burgers-chicken' }] },
  { file: 'chicken-classic-burger.jpeg',  targets: [{ kind: 'item', name: 'Chicken Classic',        categorySlug: 'burgers-chicken' }] },
  { file: 'zinger-x-special-burger.jpeg', targets: [{ kind: 'item', name: 'Zinger X Special Burger',categorySlug: 'burgers-chicken' }] },
  { file: 'zinger-mighty-x-burger.jpeg',  targets: [{ kind: 'item', name: 'Zinger Mighty X Burger', categorySlug: 'burgers-chicken' }] },

  // ── Burgers (Beef) ─────────────────────────────────────────────────────────
  { file: 'beef-x-classic-burger.jpeg',  targets: [{ kind: 'item', name: 'Beef X Classic', categorySlug: 'burgers-beef' }] },
  { file: 'mighty-x-beef-burger.jpeg',   targets: [{ kind: 'item', name: 'Mighty X Beef',  categorySlug: 'burgers-beef' }] },

  // ── Shawarma & Platters ────────────────────────────────────────────────────
  // Same image applied to both Large Shawarma and Special Shawarma —
  //   no separate photo provided for Special Shawarma.
  //   Replace via admin once distinct photography is available.
  {
    file: 'chicken-shawarma.jpeg',
    targets: [
      { kind: 'item', name: 'Large Shawarma',   categorySlug: 'shawarma-platters' },
      { kind: 'item', name: 'Special Shawarma', categorySlug: 'shawarma-platters' },
    ],
    note: '⚑  chicken-shawarma.jpeg shared by "Large Shawarma" + "Special Shawarma" — replace if distinct images arrive',
  },
  { file: 'zinger-shawarma.jpeg', targets: [{ kind: 'item', name: 'Zinger Shawarma', categorySlug: 'shawarma-platters' }] },
  // Same image applied to both platters — no separate photo for YUM X Special Platter.
  {
    file: 'chicken-platter.jpeg',
    targets: [
      { kind: 'item', name: 'Classic Platter',       categorySlug: 'shawarma-platters' },
      { kind: 'item', name: 'YUM X Special Platter', categorySlug: 'shawarma-platters' },
    ],
    note: '⚑  chicken-platter.jpeg shared by "Classic Platter" + "YUM X Special Platter" — replace if distinct images arrive',
  },

  // ── Zinger Strips / Hot Wings / Nuggets ────────────────────────────────────
  { file: 'zinger-strips.jpeg',   targets: [{ kind: 'item', name: 'Zinger Strips', categorySlug: 'zinger-strips' }] },
  { file: 'hot-wings.jpeg',       targets: [{ kind: 'item', name: 'Hot Wings',     categorySlug: 'hot-wings'     }] },
  { file: 'chicken-nuggets.jpeg', targets: [{ kind: 'item', name: 'Nuggets',       categorySlug: 'nuggets'       }] },

  // ── Salted Fries ───────────────────────────────────────────────────────────
  { file: 'fries.jpeg', targets: [{ kind: 'item', name: 'Salted Fries', categorySlug: 'salted-fries' }] },

  // ── Deep Pan Pizza ─────────────────────────────────────────────────────────
  { file: 'chicken-tikka-pizza.jpeg',   targets: [{ kind: 'item', name: 'Chicken Tikka',   categorySlug: 'deep-pan-pizza' }] },
  { file: 'chicken-fajita-pizza.jpeg',  targets: [{ kind: 'item', name: 'Chicken Fajita',  categorySlug: 'deep-pan-pizza' }] },
  { file: 'chicken-supreme-pizza.jpeg', targets: [{ kind: 'item', name: 'Chicken Supreme', categorySlug: 'deep-pan-pizza' }] },
  { file: 'cheese-pizza.jpeg',          targets: [{ kind: 'item', name: 'Cheese Lover',    categorySlug: 'deep-pan-pizza' }] },
  { file: 'vegitable-pizza.jpeg',       targets: [{ kind: 'item', name: 'Vegi Delight',    categorySlug: 'deep-pan-pizza' }] },
  { file: 'yumx-special-pizza.jpeg',    targets: [{ kind: 'item', name: 'YUM X Special',   categorySlug: 'deep-pan-pizza' }] },

  // ── Fried Chicken ──────────────────────────────────────────────────────────
  { file: 'chicken-bucket.jpeg', targets: [{ kind: 'item', name: 'Fried Chicken', categorySlug: 'fried-chicken' }] },

  // ── Loaded Fries (filename has a space) ────────────────────────────────────
  // Same image applied to both loaded fries items — replace via admin if distinct images arrive.
  {
    file: 'loaded fries.jpeg',
    targets: [
      { kind: 'item', name: 'Tikka Loaded Fries',  categorySlug: 'loaded-fries' },
      { kind: 'item', name: 'Zinger Loaded Fries', categorySlug: 'loaded-fries' },
    ],
    note: '⚑  "loaded fries.jpeg" shared by "Tikka Loaded Fries" + "Zinger Loaded Fries" — replace if distinct images arrive',
  },

  // ── Combo Deals ────────────────────────────────────────────────────────────
  { file: 'deal-01.jpeg', targets: [{ kind: 'deal', dealNumber: '01' }] },
  { file: 'deal-02.jpeg', targets: [{ kind: 'deal', dealNumber: '02' }] },
  { file: 'deal-03.jpeg', targets: [{ kind: 'deal', dealNumber: '03' }] },
  { file: 'deal-04.jpeg', targets: [{ kind: 'deal', dealNumber: '04' }] },
  { file: 'deal-05.png',  targets: [{ kind: 'deal', dealNumber: '05' }] },
  { file: 'deal-06.jpeg', targets: [{ kind: 'deal', dealNumber: '06' }] },
  { file: 'deal-07.jpeg', targets: [{ kind: 'deal', dealNumber: '07' }] },
  { file: 'deal-08.jpeg', targets: [{ kind: 'deal', dealNumber: '08' }] },
  { file: 'deal-09.jpeg', targets: [{ kind: 'deal', dealNumber: '09' }] },
  { file: 'deal-10.png',  targets: [{ kind: 'deal', dealNumber: '10' }] },
  { file: 'deal-11.jpeg', targets: [{ kind: 'deal', dealNumber: '11' }] },
  { file: 'deal-12.jpeg', targets: [{ kind: 'deal', dealNumber: '12' }] },
]

// Not mapped (left null intentionally — no local image provided):
// - Chicken Wrap, Zinger Wrap, Soft Drink, Mineral Water

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(filePath: string): Promise<string> {
  const filename = path.basename(filePath)
  const ext = path.extname(filename).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'

  const buffer = fs.readFileSync(filePath)
  const blob   = new Blob([buffer], { type: mimeType })

  const fd = new FormData()
  fd.append('file',          blob, filename)
  fd.append('upload_preset', UPLOAD_PRESET!)
  fd.append('folder',        FOLDER)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as { secure_url: string }
  return json.secure_url
}

// ─── DB updaters ─────────────────────────────────────────────────────────────

async function updateItem(name: string, categorySlug: string, imageUrl: string): Promise<boolean> {
  const category = await prisma.menuCategory.findUnique({ where: { slug: categorySlug } })
  if (!category) {
    console.warn(`  ⚠  Category not found for slug "${categorySlug}" (target: "${name}")`)
    return false
  }
  const item = await prisma.menuItem.findFirst({ where: { name, categoryId: category.id } })
  if (!item) {
    console.warn(`  ⚠  MenuItem not found: "${name}" in category "${categorySlug}"`)
    return false
  }
  await prisma.menuItem.update({ where: { id: item.id }, data: { imageUrl } })
  return true
}

async function updateDeal(dealNumber: string, imageUrl: string): Promise<boolean> {
  const deal = await prisma.comboDeal.findFirst({ where: { dealNumber } })
  if (!deal) {
    console.warn(`  ⚠  ComboDeal not found: dealNumber "${dealNumber}"`)
    return false
  }
  await prisma.comboDeal.update({ where: { id: deal.id }, data: { imageUrl } })
  return true
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('YUM X — Image Assignment Script')
  console.log('────────────────────────────────────────\n')

  // Upload cache: filename → Cloudinary URL (avoid re-uploading shared images)
  const urlCache = new Map<string, string>()

  let uploaded  = 0
  let updated   = 0
  let skipped   = 0   // file not on disk
  let notFound  = 0   // DB record missing

  for (const entry of MAPPING) {
    const filePath = path.join(IMAGES_DIR, entry.file)

    // ── Check file exists ────────────────────────────────────────────────────
    if (!fs.existsSync(filePath)) {
      console.log(`  ⊘  Skipped  "${entry.file}" — file not found in public/images/`)
      skipped += entry.targets.length
      continue
    }

    // ── Upload (or reuse cached URL) ─────────────────────────────────────────
    let url = urlCache.get(entry.file)
    if (!url) {
      process.stdout.write(`  ↑  Uploading "${entry.file}" … `)
      try {
        url = await uploadToCloudinary(filePath)
        urlCache.set(entry.file, url)
        uploaded++
        console.log('done')
      } catch (err) {
        console.log(`FAILED\n     ${(err as Error).message}`)
        skipped += entry.targets.length
        continue
      }
    }

    // ── Update each DB target ────────────────────────────────────────────────
    if (entry.note) {
      console.log(`     ${entry.note}`)
    }

    for (const target of entry.targets) {
      if (target.kind === 'item') {
        const ok = await updateItem(target.name, target.categorySlug, url)
        if (ok) {
          console.log(`  ✓  "${target.name}"  →  ${url}`)
          updated++
        } else {
          notFound++
        }
      } else {
        const ok = await updateDeal(target.dealNumber, url)
        if (ok) {
          console.log(`  ✓  Deal ${target.dealNumber}  →  ${url}`)
          updated++
        } else {
          notFound++
        }
      }
    }
  }

  // ── Not-mapped items (intentionally left null) ────────────────────────────
  console.log('\n  — No image provided (left null, expected):')
  const noImage = ['Chicken Wrap', 'Zinger Wrap', 'Soft Drink', 'Mineral Water']
  noImage.forEach(n => console.log(`     · ${n}`))

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────────')
  console.log('  Summary')
  console.log('────────────────────────────────────────')
  console.log(`  Files uploaded to Cloudinary : ${uploaded}`)
  console.log(`  DB records updated           : ${updated}`)
  console.log(`  Skipped (file missing)       : ${skipped}`)
  console.log(`  DB lookups failed            : ${notFound}`)
  console.log('────────────────────────────────────────\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
