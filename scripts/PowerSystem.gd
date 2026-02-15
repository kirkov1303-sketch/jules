extends Node

# class_name PowerSystem (Using preload to avoid circularity issues)

enum PowerCategory { CREATION, NATURE, DESTRUCTION, CREATURES, MAGIC }

var current_power = "none"
var current_category = PowerCategory.CREATION
var brush_size = 5
var is_circle_brush = true

var world_manager

const WORLD_SIZE = 4096 # Local constant to avoid dependency on WorldManager class during parse

func _init(_world_manager):
	world_manager = _world_manager

func use_power(pos: Vector2, is_continuous: bool = false):
	var tile_pos = world_manager.tile_map.local_to_map(pos)

	if is_circle_brush:
		apply_circle_brush(tile_pos)
	else:
		apply_rect_brush(tile_pos)

	# Multiplayer sync
	if Global.is_multiplayer and not is_continuous:
		var world = get_node("/root/World")
		if world and world.network_manager:
			world.network_manager.apply_remote_power.rpc(current_power, pos)

func apply_circle_brush(center: Vector2i):
	for x in range(center.x - brush_size, center.x + brush_size + 1):
		for y in range(center.y - brush_size, center.y + brush_size + 1):
			var dist = Vector2(center).distance_to(Vector2(x, y))
			if dist <= brush_size:
				execute_power_at(Vector2i(x, y))

func apply_rect_brush(center: Vector2i):
	for x in range(center.x - brush_size, center.x + brush_size + 1):
		for y in range(center.y - brush_size, center.y + brush_size + 1):
			execute_power_at(Vector2i(x, y))

func execute_power_at(pos: Vector2i):
	if pos.x < 0 or pos.y < 0 or pos.x >= WORLD_SIZE or pos.y >= WORLD_SIZE:
		return

	match current_power:
		"spawn_human": spawn_unit(pos, "human")
		"spawn_orc": spawn_unit(pos, "orc")
		"rain": apply_rain(pos)
		"fire": apply_fire(pos)
		"nuke": apply_nuke(pos)
		"lightning": apply_lightning(pos)
		"set_grass": world_manager.set_tile(pos.x, pos.y, 3) # Use int values to avoid enum dependency
		"set_sand": world_manager.set_tile(pos.x, pos.y, 7)
		"heal": apply_heal(pos)
		"bless": apply_trait(pos, "blessed")
		"spawn_wolf": spawn_unit(pos, "wolf")
		"spawn_dragon": spawn_unit(pos, "dragon")

func apply_heal(pos: Vector2i):
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 30)
	for unit in affected_units:
		unit.health = unit.max_health

func apply_trait(pos: Vector2i, trait: String):
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 30)
	for unit in affected_units:
		if not unit.traits.has(trait):
			unit.traits.append(trait)

func spawn_unit(pos: Vector2i, race: String):
	var unit = world_manager.get_unit_from_pool()
	unit.position = world_manager.tile_map.map_to_local(pos)
	unit.race = race
	if not unit.get_parent():
		world_manager.add_child(unit)
	world_manager.units.append(unit)

func apply_rain(pos: Vector2i):
	var biome = world_manager.get_tile_biome(pos)
	if biome == 7: # DESERT
		world_manager.set_tile(pos.x, pos.y, 3) # PLAINS
	elif biome == 14: # WASTELAND
		world_manager.set_tile(pos.x, pos.y, 3) # PLAINS

func apply_fire(pos: Vector2i):
	# Start fire simulation at this tile
	world_manager.start_fire(pos)

func apply_nuke(pos: Vector2i):
	world_manager.set_tile(pos.x, pos.y, 14) # WASTELAND
	# Kill units in area using spatial hash
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 50)
	for unit in affected_units:
		unit.die()

func apply_lightning(pos: Vector2i):
	# Visual effect then damage using spatial hash
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 20)
	for unit in affected_units:
		unit.take_damage(100)
