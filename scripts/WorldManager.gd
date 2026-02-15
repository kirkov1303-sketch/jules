extends Node2D

class_name WorldManager

const WORLD_SIZE = 4096
const CHUNK_SIZE = 64
const TILE_SIZE = 16

enum Biome {
	DEEP_OCEAN, OCEAN, BEACH, PLAINS, FOREST, JUNGLE, SWAMP, DESERT,
	SNOW, TUNDRA, TAIGA, MOUNTAINS, VOLCANO, CORRUPTED, WASTELAND,
	MUSHROOM, MAGIC, HELL, VOID, CRYSTAL
}

var tile_map: TileMap
var noise: FastNoiseLite
var temperature_noise: FastNoiseLite
var moisture_noise: FastNoiseLite

var kingdoms = []
var units = []
var buildings = []
var unit_pool = []
var unit_scene = preload("res://scenes/Unit.tscn")
var spatial_hash = {}
const CELL_SIZE = 64

class Kingdom:
	var name: String
	var color: Color
	var race: String
	var cities = []
	var relations = {} # kingdom_name -> int (score)
	var tech_level = 0
	var gold = 100
	var resources = {"wood": 0, "stone": 0, "iron": 0}

	func _init(_name, _color, _race):
		name = _name
		color = _color
		race = _race

var sim_timer = 0.0

func _ready():
	setup_noises()

func _process(delta):
	sim_timer += delta
	if sim_timer > 1.0:
		sim_timer = 0
		update_diplomacy()
		perform_trade()
		simulate_erosion()
	update_spatial_hash()

func update_spatial_hash():
	spatial_hash.clear()
	for unit in units:
		var cell = Vector2i(unit.position / CELL_SIZE)
		if not spatial_hash.has(cell):
			spatial_hash[cell] = []
		spatial_hash[cell].append(unit)

func get_units_in_range(pos: Vector2, radius: float) -> Array:
	var found_units = []
	var min_cell = Vector2i((pos - Vector2(radius, radius)) / CELL_SIZE)
	var max_cell = Vector2i((pos + Vector2(radius, radius)) / CELL_SIZE)

	for x in range(min_cell.x, max_cell.x + 1):
		for y in range(min_cell.y, max_cell.y + 1):
			var cell = Vector2i(x, y)
			if spatial_hash.has(cell):
				for unit in spatial_hash[cell]:
					if unit.position.distance_to(pos) <= radius:
						found_units.append(unit)
	return found_units

func setup_noises():
	noise = FastNoiseLite.new()
	noise.seed = randi()
	noise.frequency = 0.01

	temperature_noise = FastNoiseLite.new()
	temperature_noise.seed = randi()
	temperature_noise.frequency = 0.005

	moisture_noise = FastNoiseLite.new()
	moisture_noise.seed = randi()
	moisture_noise.frequency = 0.008

var visible_chunks = {}

func generate_world():
	if not tile_map: return
	# Initial generation could still be slow, ideally we generate on the fly
	# For prototype, we'll generate around a starting point
	update_visible_chunks(Vector2(WORLD_SIZE/2, WORLD_SIZE/2))

func update_visible_chunks(camera_pos: Vector2):
	var center_chunk_x = int(camera_pos.x / (CHUNK_SIZE * TILE_SIZE))
	var center_chunk_y = int(camera_pos.y / (CHUNK_SIZE * TILE_SIZE))

	var radius = 2 # Number of chunks around camera

	var new_visible_chunks = {}
	for x in range(center_chunk_x - radius, center_chunk_x + radius + 1):
		for y in range(center_chunk_y - radius, center_chunk_y + radius + 1):
			if x < 0 or y < 0 or x * CHUNK_SIZE >= WORLD_SIZE or y * CHUNK_SIZE >= WORLD_SIZE:
				continue
			var chunk_key = Vector2i(x, y)
			new_visible_chunks[chunk_key] = true
			if not visible_chunks.has(chunk_key):
				generate_chunk(x * CHUNK_SIZE, y * CHUNK_SIZE)

	# Optional: clear far away chunks from TileMap to save memory if needed
	# for key in visible_chunks:
	#	if not new_visible_chunks.has(key):
	#		clear_chunk(key.x * CHUNK_SIZE, key.y * CHUNK_SIZE)

	visible_chunks = new_visible_chunks

func generate_chunk(start_x, start_y):
	for x in range(start_x, start_x + CHUNK_SIZE):
		for y in range(start_y, start_y + CHUNK_SIZE):
			if x >= WORLD_SIZE or y >= WORLD_SIZE: continue

			var h = noise.get_noise_2d(x, y)
			var temp = temperature_noise.get_noise_2d(x, y)
			var humid = moisture_noise.get_noise_2d(x, y)

			var biome = determine_biome(h, temp, humid)
			set_tile(x, y, biome)

func determine_biome(h, temp, humid):
	if h < -0.3: return Biome.DEEP_OCEAN
	if h < -0.1: return Biome.OCEAN
	if h < -0.05: return Biome.BEACH

	if h > 0.4: return Biome.MOUNTAINS
	if h > 0.35 and temp > 0.3: return Biome.VOLCANO

	if temp < -0.2:
		if humid < -0.1: return Biome.TUNDRA
		return Biome.SNOW

	if temp > 0.2:
		if humid < -0.2: return Biome.DESERT
		if humid > 0.2: return Biome.JUNGLE

	if humid > 0.3: return Biome.SWAMP
	if humid < -0.3: return Biome.WASTELAND

	# Special biomes based on rare noise combinations
	if abs(temp) < 0.05 and abs(humid) > 0.4: return Biome.MUSHROOM
	if temp > 0.4 and humid < -0.4: return Biome.HELL

	if h > 0.1: return Biome.FOREST
	return Biome.PLAINS

func set_tile(x, y, biome):
	if x < 0 or y < 0 or x >= WORLD_SIZE or y >= WORLD_SIZE: return
	# TileMap setup will be in World.tscn
	# 0 is the layer, source_id is 0, atlas_coords depends on biome
	tile_map.set_cell(0, Vector2i(x, y), 0, Vector2i(biome, 0))

func get_tile_biome(pos: Vector2i) -> int:
	if pos.x < 0 or pos.y < 0 or pos.x >= WORLD_SIZE or pos.y >= WORLD_SIZE: return Biome.VOID
	var data = tile_map.get_cell_atlas_coords(0, pos)
	return int(data.x)

func start_fire(pos: Vector2i):
	# Fire spreading logic
	set_tile(pos.x, pos.y, Biome.VOLCANO) # Placeholder for burnt land

func update_chunk(x, y):
	# Implementation for partial updates
	pass

func get_unit_from_pool() -> Node:
	if unit_pool.size() > 0:
		var u = unit_pool.pop_back()
		if u.has_method("reset"):
			u.reset()
		return u
	else:
		return unit_scene.instantiate()

func return_unit_to_pool(unit: Node):
	unit.visible = false
	unit.process_mode = PROCESS_MODE_DISABLED
	if not unit_pool.has(unit):
		unit_pool.append(unit)
	if units.has(unit):
		units.erase(unit)

func create_kingdom(race: String, pos: Vector2i):
	var k_name = race + " Kingdom " + str(kingdoms.size() + 1)
	var k_color = Color(randf(), randf(), randf())
	var kingdom = Kingdom.new(k_name, k_color, race)
	kingdoms.append(kingdom)
	place_building(pos, kingdom, "capital")

func place_building(pos: Vector2i, kingdom: Kingdom, type: String):
	# In a real game, this would spawn a scene
	var building = {
		"pos": pos,
		"kingdom": kingdom,
		"type": type,
		"health": 500
	}
	buildings.append(building)
	# Mark tile as occupied or change visual
	set_tile(pos.x, pos.y, Biome.MAGIC) # Use MAGIC biome as placeholder for buildings

func update_diplomacy():
	for k1 in kingdoms:
		for k2 in kingdoms:
			if k1 == k2: continue

			if not k1.relations.has(k2.name):
				k1.relations[k2.name] = 0

			# Random shifts
			k1.relations[k2.name] += randi_range(-5, 5)

			if k1.relations[k2.name] < -50:
				declare_war(k1, k2)
			elif k1.relations[k2.name] > 50:
				form_alliance(k1, k2)

func declare_war(k1, k2):
	print(k1.name, " declared war on ", k2.name)

func form_alliance(k1, k2):
	print(k1.name, " formed an alliance with ", k2.name)

func perform_trade():
	for k in kingdoms:
		k.gold += 1 # Passive income from trade
		if k.gold > 1000 and k.tech_level < 10:
			k.tech_level += 1
			k.gold -= 1000
			print(k.name, " reached tech level ", k.tech_level)

func simulate_erosion():
	# Simple erosion: Mountains slowly turn to plains
	for i in range(10):
		var rx = randi() % WORLD_SIZE
		var ry = randi() % WORLD_SIZE
		var biome = get_tile_biome(Vector2i(rx, ry))
		if biome == Biome.MOUNTAINS:
			set_tile(rx, ry, Biome.PLAINS)

# Persistence
func save_to_file(filepath: String):
	var file = FileAccess.open(filepath, FileAccess.WRITE)
	if file:
		file.store_string(serialize_world())
		file.close()

func load_from_file(filepath: String):
	var file = FileAccess.open(filepath, FileAccess.READ)
	if file:
		var content = file.get_as_text()
		deserialize_world(content)
		file.close()

func serialize_world():
	var k_data = []
	for k in kingdoms:
		k_data.append({
			"name": k.name,
			"race": k.race,
			"relations": k.relations
		})

	var u_data = []
	for u in units:
		u_data.append({
			"race": u.race,
			"pos": [u.position.x, u.position.y],
			"health": u.health,
			"traits": u.traits
		})

	var data = {
		"seed": noise.seed,
		"kingdoms": k_data,
		"units": u_data
	}
	return JSON.stringify(data)

func deserialize_world(json_string):
	var data = JSON.parse_string(json_string)
	if data:
		noise.seed = data.seed
		generate_world()
		# Logic to recreate kingdoms and units
		for kd in data.kingdoms:
			var k = Kingdom.new(kd.name, Color.WHITE, kd.race)
			k.relations = kd.relations
			kingdoms.append(k)
		for ud in data.units:
			var u = unit_scene.instantiate()
			u.race = ud.race
			u.position = Vector2(ud.pos[0], ud.pos[1])
			u.health = ud.health
			u.traits = ud.traits
			add_child(u)
			units.append(u)
