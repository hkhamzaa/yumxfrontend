import type { ComboDeal, MenuCategory, MenuData, MenuItem } from '@/types/menu'

function item(
  id: string,
  categoryId: string,
  name: string,
  description: string,
  imageUrl: string,
  price: string,
  featured = false
): MenuItem {
  return {
    id,
    categoryId,
    name,
    description,
    imageUrl,
    isAvailable: true,
    isFeatured: featured,
    variants: [{ id: `${id}-regular`, label: 'Regular', price, menuItemId: id }],
  }
}

const chickenBurgers = [
  item('item-zinger-classic', 'cat-chicken-burgers', 'Zinger Classic Burger', 'Crispy chicken fillet, lettuce, cheese, and house sauce.', '/images/zinger-classic-burger.jpeg', '520', true),
  item('item-chicken-classic', 'cat-chicken-burgers', 'Chicken Classic Burger', 'Grilled chicken patty with fresh salad and creamy mayo.', '/images/chicken-classic-burger.jpeg', '460'),
  item('item-zinger-x', 'cat-chicken-burgers', 'Zinger X Special Burger', 'A taller, saucier zinger with extra crunch and melted cheese.', '/images/zinger-x-special-burger.jpeg', '690', true),
]

const pizzas = [
  item('item-chicken-fajita-pizza', 'cat-pizza', 'Chicken Fajita Pizza', 'Smoky fajita chicken, peppers, onions, and mozzarella.', '/images/chicken-fajita-pizza.jpeg', '880', true),
  item('item-chicken-tikka-pizza', 'cat-pizza', 'Chicken Tikka Pizza', 'Spiced tikka chunks over a rich cheese base.', '/images/chicken-tikka-pizza.jpeg', '920'),
  item('item-cheese-pizza', 'cat-pizza', 'Cheese Pizza', 'Golden mozzarella, oregano, and signature pizza sauce.', '/images/cheese-pizza.jpeg', '780'),
]

const sides = [
  item('item-hot-wings', 'cat-sides', 'Hot Wings', 'Juicy wings tossed in a fiery glaze.', '/images/hot-wings.jpeg', '430', true),
  item('item-loaded-fries', 'cat-sides', 'Loaded Fries', 'Crispy fries with cheese sauce, chicken, and toppings.', '/images/loaded fries.jpeg', '390'),
  item('item-nuggets', 'cat-sides', 'Chicken Nuggets', 'Golden bite-sized chicken with dip.', '/images/chicken-nuggets.jpeg', '360'),
]

function category(
  id: string,
  name: string,
  slug: string,
  imageUrl: string,
  displayOrder: number,
  items: MenuItem[]
): MenuCategory {
  const prices = items.flatMap((menuItem) => menuItem.variants.map((variant) => Number(variant.price)))

  return {
    id,
    name,
    slug,
    imageUrl,
    displayImageUrl: imageUrl,
    startingPrice: Math.min(...prices),
    displayOrder,
    isActive: true,
    items,
  }
}

export const mockMenuData: MenuData = {
  categories: [
    category('cat-chicken-burgers', 'Burgers (Chicken)', 'chicken-burgers', '/images/zinger-x-special-burger.jpeg', 1, chickenBurgers),
    category('cat-pizza', 'Deep Pan Pizza', 'deep-pan-pizza', '/images/yumx-special-pizza.jpeg', 2, pizzas),
    category('cat-sides', 'Hot Wings', 'hot-wings', '/images/hot-wings.jpeg', 3, sides),
  ],
  combos: [
    { id: 'deal-01', dealNumber: '01', title: 'Burger Duo', description: 'Two signature burgers with fries and chilled drinks.', imageUrl: '/images/deal-01.jpeg', price: '1290', isActive: true, displayOrder: 1 },
    { id: 'deal-02', dealNumber: '02', title: 'Family Pizza Box', description: 'Large pizza, wings, fries, and drinks for the table.', imageUrl: '/images/deal-02.jpeg', price: '2190', isActive: true, displayOrder: 2 },
    { id: 'deal-03', dealNumber: '03', title: 'Snack Attack', description: 'Loaded fries, nuggets, strips, and sauces.', imageUrl: '/images/deal-03.jpeg', price: '990', isActive: true, displayOrder: 3 },
  ],
}

export const mockFeaturedItems = mockMenuData.categories.flatMap((category) =>
  category.items
    .filter((menuItem) => menuItem.isFeatured)
    .map((menuItem) => ({ ...menuItem, category: { name: category.name } }))
)

export const mockCombos: ComboDeal[] = mockMenuData.combos

export const mockGallery = [
  { id: 'gallery-1', imageUrl: '/images/zinger-x-special-burger.jpeg', caption: 'Crispy signature stack', displayOrder: 1 },
  { id: 'gallery-2', imageUrl: '/images/yumx-special-pizza.jpeg', caption: 'Fresh from the oven', displayOrder: 2 },
  { id: 'gallery-3', imageUrl: '/images/loaded fries.jpeg', caption: 'Loaded fries with house sauce', displayOrder: 3 },
  { id: 'gallery-4', imageUrl: '/images/hot-wings.jpeg', caption: 'Glazed hot wings', displayOrder: 4 },
  { id: 'gallery-5', imageUrl: '/images/chicken-platter.jpeg', caption: 'Shareable platter', displayOrder: 5 },
]

export const mockTestimonials = [
  { id: 'testimonial-1', customerName: 'Ayesha Khan', rating: 5, reviewText: 'The zinger was fresh, crunchy, and the sauce had exactly the right kick.' },
  { id: 'testimonial-2', customerName: 'Hamza Malik', rating: 5, reviewText: 'Fast delivery, hot pizza, and the combo deals actually feel worth it.' },
  { id: 'testimonial-3', customerName: 'Sara Ahmed', rating: 4, reviewText: 'Loaded fries were rich and generous. Perfect late-night order.' },
]

export const mockSchedule = [
  { id: 'schedule-0', dayOfWeek: 0, openTime: '12:00', closeTime: '23:30', isClosed: false },
  { id: 'schedule-1', dayOfWeek: 1, openTime: '12:00', closeTime: '23:30', isClosed: false },
  { id: 'schedule-2', dayOfWeek: 2, openTime: '12:00', closeTime: '23:30', isClosed: false },
  { id: 'schedule-3', dayOfWeek: 3, openTime: '12:00', closeTime: '23:30', isClosed: false },
  { id: 'schedule-4', dayOfWeek: 4, openTime: '12:00', closeTime: '00:30', isClosed: false },
  { id: 'schedule-5', dayOfWeek: 5, openTime: '13:00', closeTime: '00:30', isClosed: false },
  { id: 'schedule-6', dayOfWeek: 6, openTime: '13:00', closeTime: '23:30', isClosed: false },
]

export const mockSiteContent = {
  address: 'Main Boulevard, Lahore, Punjab',
  phone: '+92 300 1234567',
  whatsapp_number: '+923001234567',
  email: 'hello@yumx.test',
  instagram_url: 'https://instagram.com/yumx',
  facebook_url: 'https://facebook.com/yumx',
  delivery_fee: '150',
}
