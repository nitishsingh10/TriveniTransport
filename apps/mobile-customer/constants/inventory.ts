import React from 'react';
import {
  Armchair,
  Baby,
  Bed,
  Bike,
  BookOpen,
  Box,
  BriefcaseBusiness,
  Coffee,
  CookingPot,
  DoorClosed,
  Dumbbell,
  Fan,
  Laptop,
  LampFloor,
  MirrorRectangular,
  Monitor,
  Package,
  PackagePlus,
  Printer,
  Refrigerator,
  ShieldCheck,
  Speaker,
  Table2,
  Tv,
  UtensilsCrossed,
  WashingMachine,
} from 'lucide-react-native';

export interface RoomItem {
  id: string;
  serverId?: string;
  name: string;
  icon: React.ComponentType<any>;
  defaultCft: number;
  baseRate: number;
}

export interface RoomSection {
  room: string;
  icon: React.ComponentType<any>;
  items: RoomItem[];
}

export const DEFAULT_CATALOG: RoomSection[] = [
  {
    room: 'Living Room', icon: Armchair, items: [
      { id: 'sofa_3', name: 'Sofa (3-seater)', icon: Armchair, defaultCft: 60, baseRate: 700 },
      { id: 'sofa_2', name: 'Sofa (2-seater)', icon: Armchair, defaultCft: 40, baseRate: 500 },
      { id: 'tv_unit', name: 'TV Unit / Entertainment Unit', icon: Tv, defaultCft: 30, baseRate: 400 },
      { id: 'coffee_table', name: 'Coffee Table', icon: Coffee, defaultCft: 15, baseRate: 200 },
      { id: 'recliner', name: 'Recliner', icon: Armchair, defaultCft: 35, baseRate: 450 },
      { id: 'armchair', name: 'Armchair', icon: Armchair, defaultCft: 22, baseRate: 300 },
      { id: 'bookshelf', name: 'Bookshelf', icon: BookOpen, defaultCft: 35, baseRate: 450 },
      { id: 'showcase', name: 'Display Cabinet / Showcase', icon: DoorClosed, defaultCft: 50, baseRate: 650 },
      { id: 'shoe_rack', name: 'Shoe Rack', icon: Package, defaultCft: 12, baseRate: 200 },
      { id: 'floor_lamp', name: 'Floor Lamp', icon: LampFloor, defaultCft: 8, baseRate: 120 },
      { id: 'mandir_small', name: 'Mandir / Pooja Unit (Small)', icon: DoorClosed, defaultCft: 12, baseRate: 300 },
      { id: 'mandir_medium', name: 'Mandir / Pooja Unit (Medium)', icon: DoorClosed, defaultCft: 24, baseRate: 500 },
      { id: 'mandir_large', name: 'Mandir / Pooja Unit (Large)', icon: DoorClosed, defaultCft: 40, baseRate: 800 },
      { id: 'pillow_set', name: 'Pillow Set', icon: Bed, defaultCft: 4, baseRate: 80 },
      { id: 'blanket', name: 'Blanket / Comforter', icon: Bed, defaultCft: 6, baseRate: 100 },
      { id: 'full_mirror', name: 'Full-Length Mirror', icon: MirrorRectangular, defaultCft: 12, baseRate: 250 },
      { id: 'curtains', name: 'Curtains (per pair)', icon: DoorClosed, defaultCft: 5, baseRate: 100 },
    ],
  },
  {
    room: 'Bedroom', icon: Bed, items: [
      { id: 'double_bed', name: 'Double Bed (with mattress)', icon: Bed, defaultCft: 80, baseRate: 800 },
      { id: 'single_bed', name: 'Single Bed (with mattress)', icon: Bed, defaultCft: 50, baseRate: 500 },
      { id: 'wardrobe_3', name: 'Wardrobe (3-door)', icon: DoorClosed, defaultCft: 90, baseRate: 1200 },
      { id: 'wardrobe', name: 'Wardrobe (2-door)', icon: DoorClosed, defaultCft: 60, baseRate: 900 },
      { id: 'dressing', name: 'Dressing Table', icon: MirrorRectangular, defaultCft: 25, baseRate: 400 },
      { id: 'mattress', name: 'Single Mattress', icon: Bed, defaultCft: 20, baseRate: 250 },
      { id: 'bedside_table', name: 'Bedside Table', icon: Table2, defaultCft: 8, baseRate: 150 },
      { id: 'chest_drawers', name: 'Chest of Drawers', icon: Package, defaultCft: 30, baseRate: 450 },
      { id: 'study_desk', name: 'Study Desk', icon: BookOpen, defaultCft: 35, baseRate: 450 },
      { id: 'baby_crib', name: 'Baby Crib / Cot', icon: Baby, defaultCft: 30, baseRate: 400 },
      { id: 'mandir_wall', name: 'Mandir / Pooja Shelf (Wall Mounted)', icon: DoorClosed, defaultCft: 8, baseRate: 220 },
    ],
  },
  {
    room: 'Kitchen & Appliances', icon: UtensilsCrossed, items: [
      { id: 'fridge_single', name: 'Refrigerator (Single Door)', icon: Refrigerator, defaultCft: 20, baseRate: 600 },
      { id: 'fridge', name: 'Refrigerator (Double Door)', icon: Refrigerator, defaultCft: 30, baseRate: 900 },
      { id: 'washing_front', name: 'Washing Machine (Front Load)', icon: WashingMachine, defaultCft: 20, baseRate: 700 },
      { id: 'washing', name: 'Washing Machine (Top Load)', icon: WashingMachine, defaultCft: 18, baseRate: 500 },
      { id: 'microwave', name: 'Microwave', icon: CookingPot, defaultCft: 5, baseRate: 200 },
      { id: 'dishwasher', name: 'Dishwasher', icon: WashingMachine, defaultCft: 15, baseRate: 500 },
      { id: 'gas_stove', name: 'Gas Stove / Cooktop', icon: CookingPot, defaultCft: 8, baseRate: 180 },
      { id: 'water_purifier', name: 'Water Purifier', icon: Box, defaultCft: 6, baseRate: 150 },
      { id: 'kitchen_island', name: 'Kitchen Cabinet / Island', icon: DoorClosed, defaultCft: 45, baseRate: 650 },
      { id: 'small_appliance', name: 'Air Fryer / Small Appliance', icon: CookingPot, defaultCft: 4, baseRate: 100 },
      { id: 'kitchen_utensils', name: 'Kitchen Utensils / Cookware Box', icon: CookingPot, defaultCft: 8, baseRate: 180 },
      { id: 'crockery_box', name: 'Crockery / Glassware Box', icon: UtensilsCrossed, defaultCft: 6, baseRate: 200 },
      { id: 'water_dispenser', name: 'Water Dispenser', icon: CookingPot, defaultCft: 15, baseRate: 350 },
    ],
  },
  {
    room: 'Electronics', icon: Monitor, items: [
      { id: 'tv_small', name: 'LED TV (32–43 inch)', icon: Tv, defaultCft: 8, baseRate: 300 },
      { id: 'tv_large', name: 'LED TV (50+ inch)', icon: Tv, defaultCft: 15, baseRate: 500 },
      { id: 'desktop', name: 'Desktop Computer / Monitor', icon: Monitor, defaultCft: 8, baseRate: 250 },
      { id: 'ac_split', name: 'AC (Split Unit)', icon: Fan, defaultCft: 25, baseRate: 800 },
      { id: 'laptop', name: 'Laptop / Tablet', icon: Laptop, defaultCft: 3, baseRate: 100 },
      { id: 'printer', name: 'Printer / Scanner', icon: Printer, defaultCft: 8, baseRate: 180 },
      { id: 'speakers', name: 'Home Theatre / Speaker Set', icon: Speaker, defaultCft: 15, baseRate: 250 },
      { id: 'air_cooler', name: 'Air Cooler', icon: Fan, defaultCft: 25, baseRate: 350 },
      { id: 'inverter', name: 'Inverter / UPS', icon: ShieldCheck, defaultCft: 12, baseRate: 250 },
      { id: 'ceiling_fan', name: 'Ceiling Fan', icon: Fan, defaultCft: 5, baseRate: 120 },
      { id: 'desktop_cpu', name: 'Desktop CPU', icon: Monitor, defaultCft: 5, baseRate: 180 },
      { id: 'gaming_console', name: 'Gaming Console', icon: Monitor, defaultCft: 3, baseRate: 120 },
      { id: 'soundbar', name: 'Soundbar', icon: Speaker, defaultCft: 5, baseRate: 150 },
    ],
  },
  {
    room: 'Dining', icon: UtensilsCrossed, items: [
      { id: 'dining_4', name: 'Dining Table (4-seater)', icon: Table2, defaultCft: 40, baseRate: 500 },
      { id: 'dining_6', name: 'Dining Table (6-seater)', icon: Table2, defaultCft: 55, baseRate: 700 },
      { id: 'dining_chair', name: 'Dining Chair', icon: Armchair, defaultCft: 6, baseRate: 100 },
      { id: 'bar_stool', name: 'Bar Stool', icon: Armchair, defaultCft: 5, baseRate: 90 },
      { id: 'dining_cabinet', name: 'Dining Crockery Cabinet', icon: DoorClosed, defaultCft: 35, baseRate: 500 },
    ],
  },
  {
    room: 'Cartons & Storage', icon: Package, items: [
      { id: 'boxes_sm', name: 'Carton Box (Small)', icon: Package, defaultCft: 3, baseRate: 90 },
      { id: 'boxes_medium', name: 'Carton Box (Medium)', icon: Box, defaultCft: 5, baseRate: 150 },
      { id: 'boxes_lg', name: 'Carton Box (Large)', icon: PackagePlus, defaultCft: 8, baseRate: 200 },
      { id: 'suitcase', name: 'Suitcase / Travel Bag', icon: PackagePlus, defaultCft: 8, baseRate: 140 },
      { id: 'storage_crate', name: 'Plastic Storage Crate', icon: Box, defaultCft: 6, baseRate: 120 },
      { id: 'clothes_box', name: 'Clothes / Linen Box', icon: Package, defaultCft: 8, baseRate: 160 },
      { id: 'plastic_drawer', name: 'Plastic Drawer Unit', icon: Package, defaultCft: 10, baseRate: 180 },
    ],
  },
  {
    room: 'Office', icon: BriefcaseBusiness, items: [
      { id: 'office_chair', name: 'Office Chair', icon: Armchair, defaultCft: 18, baseRate: 250 },
      { id: 'filing_cabinet', name: 'Filing Cabinet', icon: BriefcaseBusiness, defaultCft: 25, baseRate: 400 },
      { id: 'workstation', name: 'Office Desk / Workstation', icon: BriefcaseBusiness, defaultCft: 45, baseRate: 600 },
      { id: 'safe', name: 'Safe / Locker', icon: ShieldCheck, defaultCft: 12, baseRate: 700 },
      { id: 'conference_table', name: 'Conference Table', icon: Table2, defaultCft: 60, baseRate: 750 },
      { id: 'office_partition', name: 'Office Partition (per panel)', icon: BriefcaseBusiness, defaultCft: 20, baseRate: 300 },
    ],
  },
  {
    room: 'Vehicles & Outdoor', icon: Bike, items: [
      { id: 'bicycle', name: 'Bicycle', icon: Bike, defaultCft: 20, baseRate: 300 },
      { id: 'scooter', name: 'Scooter / Motorcycle', icon: Bike, defaultCft: 45, baseRate: 1200 },
      { id: 'treadmill', name: 'Treadmill / Exercise Machine', icon: Dumbbell, defaultCft: 40, baseRate: 700 },
      { id: 'garden_set', name: 'Garden Chair / Outdoor Set', icon: Armchair, defaultCft: 18, baseRate: 250 },
      { id: 'plant_small', name: 'Plant (Small, under 2 ft)', icon: Package, defaultCft: 5, baseRate: 100 },
      { id: 'plant_medium', name: 'Plant (Medium, 2–4 ft)', icon: Package, defaultCft: 12, baseRate: 180 },
      { id: 'plant_large', name: 'Plant (Large, over 4 ft)', icon: Package, defaultCft: 25, baseRate: 300 },
    ],
  },
];

const categoryIcons: Record<string, React.ComponentType<any>> = {
  bedroom: Bed,
  'living room': Armchair,
  kitchen: UtensilsCrossed,
  electronics: Monitor,
  dining: Table2,
  carton: Package,
  vehicle: Bike,
  'sports & outdoor': Dumbbell,
  office: BriefcaseBusiness,
};

function itemIcon(category: string, name: string): React.ComponentType<any> {
  const value = name.toLowerCase();
  if (value.includes('tv')) return Tv;
  if (value.includes('washing') || value.includes('dishwasher')) return WashingMachine;
  if (value.includes('fridge') || value.includes('refrigerator')) return Refrigerator;
  if (value.includes('laptop') || value.includes('computer')) return Laptop;
  if (value.includes('printer')) return Printer;
  if (value.includes('speaker') || value.includes('theatre')) return Speaker;
  if (value.includes('fan') || value.includes('cooler') || value.includes('ac')) return Fan;
  if (value.includes('bike') || value.includes('scooter') || value.includes('motorcycle')) return Bike;
  if (value.includes('box') || value.includes('carton') || value.includes('suitcase')) return Package;
  return categoryIcons[category.toLowerCase()] ?? Box;
}

export function mergeServerCatalog(items: Array<{
  id: string;
  name: string;
  category: string;
  defaultCft: number | string;
  baseHandlingRate: number | string;
}>): RoomSection[] {
  const groups = new Map<string, RoomItem[]>();
  const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
    .replace('acsplitunitindooroutdoor', 'acsplitunit');
  const serverNames = new Set(items.map((item) => normalizeName(item.name)));
  const fallbackByName = new Map(
    DEFAULT_CATALOG.flatMap((section) => section.items.map((item) => [normalizeName(item.name), item] as const))
  );
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    const fallback = fallbackByName.get(normalizeName(item.name));
    group.push({
      id: fallback?.id ?? item.id,
      serverId: item.id,
      name: item.name,
      icon: itemIcon(item.category, item.name),
      defaultCft: Number(item.defaultCft),
      baseRate: Number(item.baseHandlingRate),
    });
    groups.set(item.category, group);
  }
  const serverSections = Array.from(groups.entries()).map(([room, catalogItems]) => ({
    room,
    icon: categoryIcons[room.toLowerCase()] ?? Package,
    items: catalogItems,
  }));

  for (const fallbackSection of DEFAULT_CATALOG) {
    const missingItems = fallbackSection.items
      .filter((item) => !serverNames.has(normalizeName(item.name)))
      .map((item) => ({ ...item, baseRate: 500 }));
    if (missingItems.length === 0) continue;
    const existingSection = serverSections.find((section) => section.room === fallbackSection.room);
    if (existingSection) existingSection.items.push(...missingItems);
    else serverSections.push({ ...fallbackSection, items: missingItems });
  }

  return serverSections;
}
