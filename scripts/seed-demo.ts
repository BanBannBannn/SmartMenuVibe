/* eslint-disable no-console */
// =============================================================================
// SmartMenu - Demo data seeder
// -----------------------------------------------------------------------------
//   npm run db:seed-demo
//
// Creates three complete demo restaurants, each showing off a different menu
// design template, with real dish photos, variants, tables + QR tokens and a
// pre-built board layout. Safe to re-run: the menu and tables of each demo
// restaurant are wiped and rebuilt, other restaurants are never touched.
//
// Requires SUPABASE_SERVICE_ROLE_KEY - run it against your own project only.
// =============================================================================

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { buildFromTemplate, type TemplateContext } from "../lib/menu-layout"

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv() {
	for (const file of [".env.local", ".env"]) {
		try {
			const raw = readFileSync(resolve(process.cwd(), file), "utf8")
			for (const line of raw.split("\n")) {
				const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
				if (!m) continue
				const value = m[2].replace(/^["']|["']$/g, "")
				if (!process.env[m[1]]) process.env[m[1]] = value
			}
		} catch {
			// file is optional
		}
	}
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
	console.error(
		"Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env",
	)
	process.exit(1)
}

const db: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Photo library (Unsplash, hotlink-friendly)
// ---------------------------------------------------------------------------

const photo = (id: string) =>
	`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`

const IMG = {
	// chicken
	bucket: photo("1626645738196-c2a7c87a8f58"),
	drumsticks: photo("1626082927389-6cd097cdc6ec"),
	tenders: photo("1562967914-608f82629710"),
	popcorn: photo("1529042410759-befb1204b468"),
	wings: photo("1499636136210-6f4ee915583e"),
	roastChicken: photo("1594221708779-94832f4320d1"),
	// burgers & combos
	comboCoke: photo("1550547660-d9450f859349"),
	comboBasket: photo("1551782450-a2132b4ba21d"),
	comboFries: photo("1512152272829-e3139592d56f"),
	cheeseburger: photo("1550317138-10000687a72b"),
	doubleBurger: photo("1568901346375-23c9450c58cd"),
	chickenBurger: photo("1571091655789-405eb7a3a3a8"),
	burgerPlain: photo("1571091718767-18b5b1457add"),
	bigBurger: photo("1607013251379-e6eecfffe234"),
	burgerDark: photo("1521305916504-4a1121188589"),
	// rice / noodles / mains
	friedRice: photo("1603133872878-684f208fb84b"),
	riceChicken: photo("1626804475297-41608ea09aeb"),
	steakFries: photo("1600891964092-4316c288032e"),
	skewers: photo("1603360946369-dc9bb6258143"),
	springRolls: photo("1601050690597-df0568f70950"),
	saladBowl: photo("1546069901-ba9599a7e63c"),
	noodleSoup: photo("1552611052-33e04de081de"),
	friedNoodles: photo("1585032226651-759b368d7246"),
	pasta: photo("1621996346565-e3dbc646d9a9"),
	hotpot: photo("1585937421612-70a008356fbe"),
	curry: photo("1567337710282-00832b415979"),
	ribs: photo("1544025162-d76694265947"),
	vietPlates: photo("1504674900247-0877df9cc836"),
	paella: photo("1512058564366-18510be2db19"),
	pan: photo("1615719413546-198b25453f85"),
	pizza: photo("1513104890138-7c749659a591"),
	// bakery & dessert
	bread: photo("1509440159596-0249088772ff"),
	sandwich: photo("1476224203421-9ac39bcb3327"),
	croissant: photo("1555507036-ab1f4038808a"),
	cookies: photo("1558961363-fa8fdf82db35"),
	cupcakes: photo("1486427944299-d1955d23e34d"),
	meringue: photo("1563729784474-d77dbb933a9e"),
	cakeSlice: photo("1565958011703-44f9829ba187"),
	tiramisu: photo("1571877227200-a0d98ea607e9"),
	chocolateCake: photo("1578985545062-69928b1d9587"),
	pavlova: photo("1587314168485-3236d6710814"),
	pancakes: photo("1567620905732-2d1ec7ab7445"),
	// ice cream & drinks
	iceCreamPour: photo("1551024506-0bccd828d307"),
	milkshake: photo("1563805042-7684c019e1cb"),
	sundae: photo("1572490122747-3968b75cc699"),
	popsicles: photo("1590080875515-8a3a8dc5735e"),
	icedCoffee: photo("1461023058943-07fcbe16d735"),
	latte: photo("1541167760496-1628856ab772"),
	berryDrinks: photo("1497534446932-c925b458314e"),
	sodas: photo("1544145945-f90425340c7e"),
	orangeJuice: photo("1600271886742-f049cd451bba"),
	smoothie: photo("1610970881699-44a5587cabec"),
	coffeeBag: photo("1559056199-641a0ac8b55e"),
	cherries: photo("1559181567-c3190ca9959b"),
	// scenes (covers)
	diningRoom: photo("1517248135467-4c7edcad34c4"),
	sharedTable: photo("1466978913421-dad2ebd01d17"),
	moodyRestaurant: photo("1414235077428-338989a2e8c0"),
}

// ---------------------------------------------------------------------------
// Demo definitions
// ---------------------------------------------------------------------------

type SeedItem = {
	name: string
	description: string
	price: number
	image: string
	tags?: string[]
	variants?: { name: string; delta: number }[]
}

type SeedCategory = { name: string; description?: string; items: SeedItem[] }

type SeedRestaurant = {
	slug: string
	name: string
	email: string
	password: string
	ownerName: string
	description: string
	address: string
	city: string
	logo: string
	cover: string
	template: string
	subtitle: string
	primaryHsl: string
	tables: number
	categories: SeedCategory[]
}

const SIZE_DRINK = [
	{ name: "Vừa (M)", delta: 0 },
	{ name: "Lớn (L)", delta: 6000 },
]

const RESTAURANTS: SeedRestaurant[] = [
	// =========================================================================
	// 1. Fast food - KFC style board
	// =========================================================================
	{
		slug: "ga-ran-sai-gon",
		name: "Gà Rán Sài Gòn",
		email: "demo.garan@smartmenu.vn",
		password: "SmartMenu@Demo2026",
		ownerName: "Chủ quán Gà Rán Sài Gòn",
		description:
			"Gà rán giòn rụm chuẩn công thức, combo tiết kiệm cho cả gia đình.",
		address: "128 Nguyễn Trãi, Quận 1",
		city: "Ho Chi Minh City",
		logo: IMG.bucket,
		cover: IMG.comboCoke,
		template: "fastfood-board",
		subtitle: "Giòn rụm · Nóng hổi · Phục vụ 10:00 - 22:00",
		primaryHsl: "0 74% 42%",
		tables: 10,
		categories: [
			{
				name: "Combo tiết kiệm",
				items: [
					{
						name: "Combo Gà Giòn Solo",
						description: "1 miếng gà rán + khoai tây chiên vừa + nước ngọt vừa",
						price: 79000,
						image: IMG.comboFries,
						tags: ["best_seller", "combo"],
					},
					{
						name: "Combo Đôi Vui Vẻ",
						description: "2 miếng gà + 2 khoai tây + 2 nước ngọt lớn",
						price: 149000,
						image: IMG.comboCoke,
						tags: ["hot", "combo"],
					},
					{
						name: "Combo Gia Đình 4 Người",
						description: "6 miếng gà + 4 khoai + 1 salad lớn + 4 nước ngọt",
						price: 329000,
						image: IMG.comboBasket,
						tags: ["best_seller", "combo"],
					},
					{
						name: "Combo Burger Deluxe",
						description: "1 burger bò đôi + khoai phô mai + nước ngọt lớn",
						price: 119000,
						image: IMG.bigBurger,
						tags: ["new", "combo"],
					},
				],
			},
			{
				name: "Gà rán",
				items: [
					{
						name: "Gà rán giòn cay",
						description: "Ướp 11 loại gia vị, chiên giòn, cay vừa phải",
						price: 42000,
						image: IMG.drumsticks,
						tags: ["hot", "spicy", "best_seller"],
						variants: [
							{ name: "1 miếng", delta: 0 },
							{ name: "3 miếng", delta: 76000 },
							{ name: "6 miếng", delta: 158000 },
						],
					},
					{
						name: "Gà rán truyền thống",
						description: "Vị nguyên bản, lớp bột giòn tan, thịt mọng nước",
						price: 39000,
						image: IMG.bucket,
						tags: ["best_seller"],
						variants: [
							{ name: "1 miếng", delta: 0 },
							{ name: "3 miếng", delta: 70000 },
							{ name: "6 miếng", delta: 145000 },
						],
					},
					{
						name: "Gà viên lắc phô mai",
						description: "Gà viên chiên giòn lắc bột phô mai, kèm sốt mayo",
						price: 45000,
						image: IMG.tenders,
						tags: ["new"],
					},
					{
						name: "Gà popcorn giòn tan",
						description: "Miếng nhỏ vừa ăn, ăn vặt hay ăn kèm đều hợp",
						price: 49000,
						image: IMG.popcorn,
					},
					{
						name: "Cánh gà chiên mắm",
						description: "Cánh gà rim nước mắm tỏi, mặn ngọt đậm đà",
						price: 55000,
						image: IMG.wings,
						tags: ["hot"],
					},
					{
						name: "Gà quay nguyên con",
						description: "Gà quay mật ong, da vàng óng, đặt trước 30 phút",
						price: 259000,
						image: IMG.roastChicken,
					},
				],
			},
			{
				name: "Burger & Cơm",
				items: [
					{
						name: "Burger bò phô mai",
						description: "Bò nướng lửa, phô mai cheddar tan chảy, sốt đặc biệt",
						price: 59000,
						image: IMG.cheeseburger,
						tags: ["best_seller"],
					},
					{
						name: "Burger bò đôi",
						description: "Hai lớp bò dày, dành cho người ăn khoẻ",
						price: 85000,
						image: IMG.doubleBurger,
						tags: ["hot"],
					},
					{
						name: "Burger gà giòn",
						description: "Ức gà chiên giòn, xà lách tươi, sốt mayo trứng",
						price: 55000,
						image: IMG.chickenBurger,
					},
					{
						name: "Cơm gà xối mỡ",
						description: "Cơm nóng, đùi gà chiên xối mỡ, dưa leo và canh",
						price: 62000,
						image: IMG.riceChicken,
						tags: ["best_seller"],
					},
					{
						name: "Cơm chiên gà giòn",
						description: "Cơm chiên rau củ ăn kèm gà giòn cắt sợi",
						price: 58000,
						image: IMG.friedRice,
					},
				],
			},
			{
				name: "Món ăn kèm",
				items: [
					{
						name: "Khoai tây chiên",
						description: "Giòn ngoài mềm trong, rắc muối thảo mộc",
						price: 25000,
						image: IMG.steakFries,
						variants: SIZE_DRINK,
					},
					{
						name: "Salad bắp cải trộn",
						description: "Bắp cải, cà rốt, sốt mayo chua ngọt mát lạnh",
						price: 22000,
						image: IMG.saladBowl,
						tags: ["vegetarian"],
					},
					{
						name: "Chả giò tôm thịt",
						description: "6 cuốn chiên giòn, chấm nước mắm chua ngọt",
						price: 35000,
						image: IMG.springRolls,
					},
					{
						name: "Bánh mì bơ tỏi",
						description: "Nướng nóng, thơm mùi bơ tỏi",
						price: 18000,
						image: IMG.bread,
						tags: ["vegetarian"],
					},
				],
			},
			{
				name: "Đồ uống & Tráng miệng",
				items: [
					{
						name: "Pepsi / 7Up",
						description: "Nước ngọt có ga, phục vụ với đá",
						price: 18000,
						image: IMG.sodas,
						variants: SIZE_DRINK,
					},
					{
						name: "Trà đào cam sả",
						description: "Trà đen ủ lạnh, đào miếng, sả và cam tươi",
						price: 32000,
						image: IMG.berryDrinks,
						tags: ["new"],
						variants: SIZE_DRINK,
					},
					{
						name: "Kem sundae socola",
						description: "Kem vani phủ sốt socola đậm vị",
						price: 25000,
						image: IMG.sundae,
					},
					{
						name: "Milkshake dâu",
						description: "Sữa tươi đánh cùng kem và dâu tây",
						price: 39000,
						image: IMG.milkshake,
						tags: ["hot"],
					},
					{
						name: "Bánh trứng nướng",
						description: "Vỏ giòn, nhân trứng sữa mềm mịn, ăn nóng ngon nhất",
						price: 20000,
						image: IMG.pancakes,
					},
				],
			},
		],
	},

	// =========================================================================
	// 2. Convenience store - Circle K / 7-Eleven style grid
	// =========================================================================
	{
		slug: "circle-ban-mart",
		name: "Circle Bân Mart",
		email: "demo.mart@smartmenu.vn",
		password: "SmartMenu@Demo2026",
		ownerName: "Quản lý Circle Bân Mart",
		description:
			"Cửa hàng tiện lợi 24/7: cơm hộp, mì ly, bánh mì, cà phê và đồ ăn nhanh tại quầy.",
		address: "45 Lê Lợi, Quận 1",
		city: "Ho Chi Minh City",
		logo: IMG.coffeeBag,
		cover: IMG.sharedTable,
		template: "convenience-grid",
		subtitle: "MỞ CỬA 24/7 · GIÁ ĐÃ GỒM VAT",
		primaryHsl: "25 95% 53%",
		tables: 6,
		categories: [
			{
				name: "Cơm hộp & Mì ly",
				items: [
					{
						name: "Cơm gà xé hộp",
						description: "Cơm trắng, gà xé, trứng kho — hâm nóng 90 giây",
						price: 39000,
						image: IMG.riceChicken,
						tags: ["best_seller"],
					},
					{
						name: "Cơm chiên dương châu",
						description: "Cơm chiên trứng, lạp xưởng, đậu Hà Lan",
						price: 42000,
						image: IMG.friedRice,
					},
					{
						name: "Cơm thập cẩm hải sản",
						description: "Cơm chiên tôm mực, rau củ, ăn kèm tương ớt",
						price: 49000,
						image: IMG.paella,
						tags: ["new"],
					},
					{
						name: "Mì ly bò hầm",
						description: "Mì ly ăn liền, chỉ cần thêm nước sôi",
						price: 22000,
						image: IMG.noodleSoup,
					},
					{
						name: "Mì xào bò",
						description: "Mì xào sẵn, hâm nóng ăn ngay",
						price: 38000,
						image: IMG.friedNoodles,
					},
					{
						name: "Mì Ý sốt cà",
						description: "Mì penne sốt cà chua thịt bằm",
						price: 45000,
						image: IMG.pasta,
					},
				],
			},
			{
				name: "Bánh mì & Sandwich",
				items: [
					{
						name: "Bánh mì thịt nguội",
						description: "Bánh mì giòn, pate, thịt nguội, dưa leo",
						price: 25000,
						image: IMG.bread,
						tags: ["best_seller"],
					},
					{
						name: "Sandwich gà nướng",
						description: "Bánh mì lát, ức gà nướng, xà lách, sốt mè",
						price: 32000,
						image: IMG.sandwich,
					},
					{
						name: "Bánh sừng bò bơ",
						description: "Nướng lại 30 giây là thơm nức mũi",
						price: 22000,
						image: IMG.croissant,
						tags: ["vegetarian"],
					},
					{
						name: "Bánh mì chảo trứng",
						description: "Trứng ốp la, xúc xích, dùng nóng",
						price: 45000,
						image: IMG.pan,
					},
					{
						name: "Pizza mini phô mai",
						description: "Pizza cỡ nhỏ, hâm 2 phút, phô mai kéo sợi",
						price: 39000,
						image: IMG.pizza,
						tags: ["hot"],
					},
				],
			},
			{
				name: "Đồ nóng tại quầy",
				items: [
					{
						name: "Xúc xích nướng que",
						description: "Nướng liên tục tại quầy, chấm tương cà",
						price: 18000,
						image: IMG.skewers,
						tags: ["best_seller"],
					},
					{
						name: "Gà viên chiên",
						description: "Hộp 6 viên, kèm sốt tuỳ chọn",
						price: 35000,
						image: IMG.tenders,
					},
					{
						name: "Khoai tây chiên que",
						description: "Chiên tại chỗ, giòn nóng",
						price: 25000,
						image: IMG.steakFries,
					},
					{
						name: "Chả giò chiên",
						description: "4 cuốn nhỏ, ăn vặt buổi chiều",
						price: 28000,
						image: IMG.springRolls,
					},
					{
						name: "Cánh gà chiên nước mắm",
						description: "Hộp 4 cánh, đậm đà",
						price: 52000,
						image: IMG.wings,
						tags: ["hot", "spicy"],
					},
				],
			},
			{
				name: "Cà phê & Nước giải khát",
				items: [
					{
						name: "Cà phê sữa đá",
						description: "Pha máy, đá viên đầy ly",
						price: 25000,
						image: IMG.icedCoffee,
						tags: ["best_seller"],
						variants: SIZE_DRINK,
					},
					{
						name: "Latte nóng",
						description: "Espresso và sữa tươi đánh bọt",
						price: 35000,
						image: IMG.latte,
						variants: SIZE_DRINK,
					},
					{
						name: "Nước cam ép",
						description: "Cam tươi ép trong ngày, không đường",
						price: 32000,
						image: IMG.orangeJuice,
						tags: ["new"],
					},
					{
						name: "Sinh tố rau má",
						description: "Rau má xay cùng đậu xanh, mát lạnh",
						price: 30000,
						image: IMG.smoothie,
						tags: ["vegetarian"],
					},
					{
						name: "Soda việt quất",
						description: "Soda mát lạnh, siro việt quất",
						price: 28000,
						image: IMG.sodas,
						variants: SIZE_DRINK,
					},
					{
						name: "Cà phê gói mang về",
						description: "Túi 200g, rang mộc, xay theo yêu cầu",
						price: 95000,
						image: IMG.coffeeBag,
					},
				],
			},
			{
				name: "Kem & Bánh ngọt",
				items: [
					{
						name: "Kem que socola",
						description: "Kem sữa phủ socola giòn",
						price: 15000,
						image: IMG.popsicles,
						tags: ["best_seller"],
					},
					{
						name: "Kem ly vani",
						description: "Kem tươi lấy tại máy, thêm topping tuỳ chọn",
						price: 20000,
						image: IMG.iceCreamPour,
					},
					{
						name: "Bánh su kem",
						description: "Nhân kem trứng, bảo quản lạnh",
						price: 18000,
						image: IMG.meringue,
					},
					{
						name: "Bánh quy socola chip",
						description: "Túi 6 cái, giòn thơm",
						price: 25000,
						image: IMG.cookies,
					},
					{
						name: "Cupcake kem tươi",
						description: "Bánh nhỏ phủ kem, hợp làm quà vặt",
						price: 22000,
						image: IMG.cupcakes,
					},
					{
						name: "Cherry Mỹ hộp 200g",
						description: "Trái cây nhập khẩu, bảo quản tủ mát",
						price: 89000,
						image: IMG.cherries,
						tags: ["new", "vegetarian"],
					},
				],
			},
		],
	},

	// =========================================================================
	// 3. Vietnamese eatery - printable A4 sheet
	// =========================================================================
	{
		slug: "quan-ban-ban",
		name: "Quán Bân Bân",
		email: "demo.quan@smartmenu.vn",
		password: "SmartMenu@Demo2026",
		ownerName: "Chủ Quán Bân Bân",
		description:
			"Quán ăn gia đình: phở, bún, cơm phần, lẩu và đồ nướng, phục vụ tận bàn.",
		address: "27 Trần Hưng Đạo, Quận 5",
		city: "Ho Chi Minh City",
		logo: IMG.noodleSoup,
		cover: IMG.diningRoom,
		template: "vietnam-a4",
		subtitle: "Cơm nhà · Nóng sốt · Phục vụ tận bàn",
		primaryHsl: "20 90% 48%",
		tables: 12,
		categories: [
			{
				name: "Phở & Bún",
				items: [
					{
						name: "Phở bò tái nạm",
						description: "Nước dùng ninh 12 tiếng, bánh phở tươi, hành trần",
						price: 65000,
						image: IMG.noodleSoup,
						tags: ["best_seller"],
						variants: [
							{ name: "Tô thường", delta: 0 },
							{ name: "Tô đặc biệt", delta: 20000 },
						],
					},
					{
						name: "Bún bò Huế",
						description: "Cay nồng chuẩn Huế, giò heo và chả cua",
						price: 68000,
						image: IMG.curry,
						tags: ["hot", "spicy"],
					},
					{
						name: "Mì xào giòn hải sản",
						description: "Mì chiên giòn, tôm mực, cải thìa, sốt sánh",
						price: 79000,
						image: IMG.friedNoodles,
					},
					{
						name: "Bún thịt nướng",
						description: "Bún tươi, thịt nướng than, nem, rau sống",
						price: 62000,
						image: IMG.vietPlates,
						tags: ["best_seller"],
					},
					{
						name: "Miến gà",
						description: "Miến dai, gà xé, nước dùng trong",
						price: 58000,
						image: IMG.riceChicken,
					},
				],
			},
			{
				name: "Cơm phần",
				items: [
					{
						name: "Cơm tấm sườn bì chả",
						description: "Sườn nướng than, bì trộn thính, chả trứng hấp",
						price: 72000,
						image: IMG.ribs,
						tags: ["best_seller", "hot"],
					},
					{
						name: "Cơm gà nướng mật ong",
						description: "Đùi gà nướng mật ong, cơm nóng, canh rong biển",
						price: 68000,
						image: IMG.roastChicken,
					},
					{
						name: "Cơm chiên hải sản",
						description: "Cơm chiên tôm mực, đậu Hà Lan, trứng",
						price: 75000,
						image: IMG.paella,
					},
					{
						name: "Cơm bò lúc lắc",
						description: "Bò xào tiêu đen, khoai tây chiên, salad",
						price: 89000,
						image: IMG.steakFries,
						tags: ["new"],
					},
					{
						name: "Cơm chay thập cẩm",
						description: "Đậu hũ, nấm, rau củ kho, canh chua chay",
						price: 55000,
						image: IMG.saladBowl,
						tags: ["vegetarian"],
					},
				],
			},
			{
				name: "Lẩu & Nướng",
				items: [
					{
						name: "Lẩu thái hải sản",
						description: "Nồi 2-3 người, chua cay, kèm rau và bún",
						price: 259000,
						image: IMG.hotpot,
						tags: ["hot", "spicy", "best_seller"],
						variants: [
							{ name: "2 người", delta: 0 },
							{ name: "4 người", delta: 140000 },
						],
					},
					{
						name: "Lẩu gà lá é",
						description: "Nước lẩu ngọt thanh, gà ta, lá é thơm",
						price: 279000,
						image: IMG.curry,
					},
					{
						name: "Sườn nướng BBQ",
						description: "Sườn heo ướp mật ong, nướng than hoa",
						price: 159000,
						image: IMG.ribs,
						tags: ["hot"],
					},
					{
						name: "Bò nướng xiên que",
						description: "6 xiên bò ướp sả ớt, ăn kèm bánh mì",
						price: 129000,
						image: IMG.skewers,
					},
					{
						name: "Ba chỉ nướng riềng mẻ",
						description: "Thịt ba chỉ nướng, chấm mắm tôm hoặc mắm nêm",
						price: 119000,
						image: IMG.pan,
					},
				],
			},
			{
				name: "Khai vị",
				items: [
					{
						name: "Gỏi ngó sen tôm thịt",
						description: "Ngó sen giòn, tôm thịt, đậu phộng rang",
						price: 79000,
						image: IMG.saladBowl,
					},
					{
						name: "Chả giò rế",
						description: "8 cuốn giòn rụm, nhân tôm thịt",
						price: 65000,
						image: IMG.springRolls,
						tags: ["best_seller"],
					},
					{
						name: "Cánh gà chiên nước mắm",
						description: "6 cánh, mặn ngọt, rắc tỏi phi",
						price: 89000,
						image: IMG.wings,
					},
					{
						name: "Khoai tây chiên phô mai",
						description: "Khoai giòn phủ sốt phô mai",
						price: 45000,
						image: IMG.steakFries,
						tags: ["vegetarian"],
					},
				],
			},
			{
				name: "Đồ uống",
				items: [
					{
						name: "Trà đá",
						description: "Trà nhà nấu, miễn phí châm thêm",
						price: 5000,
						image: IMG.icedCoffee,
					},
					{
						name: "Cà phê sữa đá",
						description: "Cà phê phin đậm, sữa đặc",
						price: 25000,
						image: IMG.latte,
						tags: ["best_seller"],
					},
					{
						name: "Nước cam vắt",
						description: "Cam sành vắt tại quán, ít đường",
						price: 35000,
						image: IMG.orangeJuice,
					},
					{
						name: "Sinh tố bơ",
						description: "Bơ sáp xay sữa đặc, béo mịn",
						price: 42000,
						image: IMG.smoothie,
						tags: ["vegetarian"],
					},
					{
						name: "Bia tươi",
						description: "Bia tươi mát lạnh, ly 330ml",
						price: 30000,
						image: IMG.sodas,
						variants: [
							{ name: "Ly 330ml", delta: 0 },
							{ name: "Tháp 3L", delta: 240000 },
						],
					},
				],
			},
		],
	},
]

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function findOrCreateOwner(r: SeedRestaurant): Promise<string> {
	const { data: created, error } = await db.auth.admin.createUser({
		email: r.email,
		password: r.password,
		email_confirm: true,
		user_metadata: { full_name: r.ownerName, role: "owner" },
	})
	if (created?.user) return created.user.id

	// Already registered - look the account up instead.
	const { data: list, error: listError } = await db.auth.admin.listUsers({
		page: 1,
		perPage: 1000,
	})
	if (listError) throw listError
	const found = list.users.find(
		(u) => u.email?.toLowerCase() === r.email.toLowerCase(),
	)
	if (!found) throw error ?? new Error(`Không tạo được tài khoản ${r.email}`)

	// Keep the demo password predictable across re-runs.
	await db.auth.admin.updateUserById(found.id, { password: r.password })
	return found.id
}

async function seedRestaurant(r: SeedRestaurant) {
	console.log(`\n▶ ${r.name} (/${r.slug})`)

	const ownerId = await findOrCreateOwner(r)
	console.log(`  owner: ${r.email}`)

	const restaurantRow = {
		owner_id: ownerId,
		name: r.name,
		slug: r.slug,
		description: r.description,
		address: r.address,
		city: r.city,
		logo_url: r.logo,
		cover_url: r.cover,
		status: "active" as const,
		theme_settings: { primary: r.primaryHsl },
	}

	const { data: existing } = await db
		.from("restaurants")
		.select("id")
		.eq("slug", r.slug)
		.maybeSingle()

	let restaurantId: string
	if (existing) {
		restaurantId = existing.id
		const { error } = await db
			.from("restaurants")
			.update(restaurantRow)
			.eq("id", restaurantId)
		if (error) throw error
		// Wipe the previous demo menu so re-runs stay clean (cascades to
		// categories, items and variants).
		await db.from("menus").delete().eq("restaurant_id", restaurantId)
		await db.from("tables").delete().eq("restaurant_id", restaurantId)
	} else {
		const { data, error } = await db
			.from("restaurants")
			.insert(restaurantRow)
			.select("id")
			.single()
		if (error) throw error
		restaurantId = data.id
	}

	const { data: menu, error: menuError } = await db
		.from("menus")
		.insert({
			restaurant_id: restaurantId,
			name: "Thực đơn chính",
			is_active: true,
			sort_order: 0,
		})
		.select("id")
		.single()
	if (menuError) throw menuError

	const templateCategories: TemplateContext["categories"] = []
	let itemCount = 0

	for (const [ci, cat] of r.categories.entries()) {
		const { data: category, error: catError } = await db
			.from("menu_categories")
			.insert({
				menu_id: menu.id,
				restaurant_id: restaurantId,
				name: cat.name,
				description: cat.description ?? null,
				sort_order: ci,
			})
			.select("id")
			.single()
		if (catError) throw catError

		const { data: items, error: itemError } = await db
			.from("menu_items")
			.insert(
				cat.items.map((item, ii) => ({
					category_id: category.id,
					restaurant_id: restaurantId,
					name: item.name,
					description: item.description,
					base_price: item.price,
					images: [item.image],
					tags: item.tags ?? [],
					is_available: true,
					sort_order: ii,
				})),
			)
			.select("id")
		if (itemError) throw itemError

		// `insert().select()` preserves input order, so index alignment is safe.
		const variantRows = cat.items.flatMap((item, ii) =>
			(item.variants ?? []).map((v, vi) => ({
				menu_item_id: items[ii].id,
				name: v.name,
				price_delta: v.delta,
				sort_order: vi,
			})),
		)
		if (variantRows.length > 0) {
			const { error } = await db.from("menu_item_variants").insert(variantRows)
			if (error) throw error
		}

		templateCategories.push({
			id: category.id,
			name: cat.name,
			itemIds: items.map((i) => i.id),
		})
		itemCount += items.length
	}

	// Tables + QR tokens. Deterministic tokens keep printed demo QR codes valid
	// across re-seeds.
	const tables = Array.from({ length: r.tables }, (_, i) => ({
		restaurant_id: restaurantId,
		table_number: String(i + 1),
		qr_code_token: `demo${r.slug.replace(/-/g, "")}${String(i + 1).padStart(2, "0")}`,
		seats: i % 3 === 0 ? 2 : 4,
		is_active: true,
	}))
	const { error: tableError } = await db.from("tables").insert(tables)
	if (tableError) throw tableError

	// Pre-built board design, generated from the dishes we just inserted.
	const layout = buildFromTemplate(r.template, {
		restaurantName: r.name,
		subtitle: r.subtitle,
		categories: templateCategories,
	})
	const { error: layoutError } = await db
		.from("menus")
		.update({ layout })
		.eq("id", menu.id)
	if (layoutError) throw layoutError

	console.log(
		`  ${r.categories.length} danh mục · ${itemCount} món · ${r.tables} bàn · mẫu "${r.template}"`,
	)
	console.log(`  Menu board:  /${r.slug}/showcase`)
	console.log(`  Gọi món bàn 1: /${r.slug}/${tables[0].qr_code_token}`)
}

async function main() {
	console.log(`Seeding demo data vào ${SUPABASE_URL}`)
	for (const r of RESTAURANTS) {
		await seedRestaurant(r)
	}
	console.log("\n✅ Xong. Đăng nhập demo (mật khẩu SmartMenu@Demo2026):")
	for (const r of RESTAURANTS) console.log(`   ${r.email}  →  ${r.name}`)
}

main().catch((err) => {
	console.error("\n❌ Seed thất bại:", err)
	process.exit(1)
})
