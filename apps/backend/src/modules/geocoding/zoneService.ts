import { prisma } from '../../config/prisma';

export class ZoneService {
  /**
   * Resolves an address or locality string into a valid LocationZone in the database.
   * Guaranteed to return a valid LocationZone row with an existing UUID.
   */
  static async resolveZoneForAddress(address: string) {
    const raw = (address || '').trim();
    const clean = raw.toLowerCase();

    // 1. Try extracting a 6-digit Indian PIN code (e.g. 400601, 411014)
    const pinMatch = raw.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      const pin = pinMatch[1];
      const zones = await prisma.locationZone.findMany();
      for (const zone of zones) {
        const pincodes = Array.isArray(zone.pincodes) ? (zone.pincodes as string[]) : [];
        if (pincodes.includes(pin)) {
          return zone;
        }
      }
    }

    // 2. Fetch all existing zones from DB
    const zones = await prisma.locationZone.findMany();
    if (zones.length === 0) {
      return this.ensureDefaultZone();
    }

    // Direct check if any zone name is mentioned in address
    for (const zone of zones) {
      const zoneName = zone.name.toLowerCase();
      if (clean.includes(zoneName) || (zoneName.length > 4 && zoneName.includes(clean))) {
        return zone;
      }
    }

    // 3. Keyword / Locality matching for Mumbai MMR, Pune, and Gujarat
    const westernKeywords = [
      'bandra', 'andheri', 'borivali', 'juhu', 'goregaon', 'malad',
      'kandivali', 'santacruz', 'khar', 'vile parle', 'dahisar', 'mira road', 'bhayandar'
    ];
    const easternKeywords = [
      'powai', 'ghatkopar', 'kurla', 'mulund', 'bhandup', 'chembur',
      'vidyavihar', 'kanjurmarg', 'sion', 'vikhroli'
    ];
    const southKeywords = [
      'colaba', 'nariman', 'dadar', 'worli', 'marine', 'byculla',
      'fort', 'churchgate', 'cuffe', 'mahim', 'prabhadevi', 'lower parel'
    ];
    const thaneKeywords = [
      'thane', 'ghodbunder', 'majiwada', 'naupada', 'wagle',
      'vartak', 'kasarvadavali', 'kalwa', 'mumbra', 'hiranandani estate'
    ];
    const naviMumbaiKeywords = [
      'vashi', 'nerul', 'belapur', 'kharghar', 'panvel',
      'airoli', 'kopar', 'ghansoli', 'sanpada', 'seawoods', 'turbhe'
    ];
    const puneKeywords = [
      'pune', 'hinjewadi', 'kothrud', 'baner', 'wakad', 'viman',
      'kharadi', 'aundh', 'magarpatta', 'hadapsar', 'koregaon', 'shivajinagar', 'pcmc', 'pimpri', 'chinchwad'
    ];
    const gujaratKeywords = [
      'gujarat', 'ahmedabad', 'surat', 'vadodara', 'vapi', 'valsad', 'baroda'
    ];

    const matches = (keywords: string[]) => keywords.some((k) => clean.includes(k));

    let candidateName: string | null = null;
    if (matches(thaneKeywords)) candidateName = 'Thane';
    else if (matches(westernKeywords)) candidateName = 'Western Suburbs';
    else if (matches(easternKeywords)) candidateName = 'Eastern Suburbs';
    else if (matches(southKeywords)) candidateName = 'Mumbai South';
    else if (matches(naviMumbaiKeywords)) candidateName = 'Navi Mumbai';
    else if (matches(puneKeywords)) candidateName = 'Pune';
    else if (matches(gujaratKeywords)) candidateName = 'Gujarat';

    if (candidateName) {
      const match = zones.find((z) => z.name.toLowerCase().includes(candidateName!.toLowerCase()));
      if (match) return match;
    }

    // 4. Default: Prefer Thane or the first zone in DB
    const thaneZone = zones.find((z) => z.name.toLowerCase().includes('thane'));
    return thaneZone || zones[0];
  }

  /**
   * Fallback if no zones exist in the database yet
   */
  private static async ensureDefaultZone() {
    let admin = await prisma.adminUser.findFirst();
    if (!admin) {
      admin = await prisma.adminUser.create({
        data: {
          name: 'Triveni Admin',
          phone: '9999999999',
        },
      });
    }

    return prisma.locationZone.create({
      data: {
        name: 'Thane',
        zoneType: 'core',
        pincodes: ['400601', '400602', '400604', '400605', '400606', '400607', '400615'],
        createdBy: admin.id,
      },
    });
  }
}
