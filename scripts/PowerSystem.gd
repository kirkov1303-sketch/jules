extends Node

# Use load() dynamically to avoid parser errors
var world_manager

func _init(_world_manager):
	world_manager = _world_manager

func use_power(pos, is_continuous = false):
	if not world_manager or not world_manager.get("tile_map"): return

	var tile_pos = world_manager.tile_map.local_to_map(pos)

	if get("is_circle_brush"):
		apply_circle_brush(tile_pos)
	else:
		apply_rect_brush(tile_pos)

	if Global.get("is_multiplayer") and not is_continuous:
		var world = get_node_or_null("/root/World")
		if world and world.get("network_manager"):
			world.network_manager.apply_remote_power.rpc(get("current_power"), pos)

var brush_size = 5
var is_circle_brush = true
var current_power = "none"

func apply_circle_brush(center):
	for x in range(center.x - brush_size, center.x + brush_size + 1):
		for y in range(center.y - brush_size, center.y + brush_size + 1):
			var dist = Vector2(center).distance_to(Vector2(x, y))
			if dist <= brush_size:
				execute_power_at(Vector2i(x, y))

func apply_rect_brush(center):
	for x in range(center.x - brush_size, center.x + brush_size + 1):
		for y in range(center.y - brush_size, center.y + brush_size + 1):
			execute_power_at(Vector2i(x, y))

func execute_power_at(pos):
	if pos.x < 0 or pos.y < 0 or pos.x >= 4096 or pos.y >= 4096:
		return

	match current_power:
		"spawn_human": spawn_unit(pos, "human")
		"spawn_orc": spawn_unit(pos, "orc")
		"rain": apply_rain(pos)
		"fire": apply_fire(pos)
		"nuke": apply_nuke(pos)
		"lightning": apply_lightning(pos)
		"set_grass": world_manager.set_tile(pos.x, pos.y, 3)
		"set_sand": world_manager.set_tile(pos.x, pos.y, 7)
		"heal": apply_heal(pos)
		"bless": apply_trait(pos, "blessed")
		"spawn_wolf": spawn_unit(pos, "wolf")
		"spawn_dragon": spawn_unit(pos, "dragon")

func apply_heal(pos):
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 30)
	for unit in affected_units:
		unit.health = unit.max_health

func apply_trait(pos, trait_name):
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 30)
	for unit in affected_units:
		var t = unit.get("traits")
		if t != null and not t.has(trait_name):
			t.append(trait_name)

func spawn_unit(pos, race):
	var unit = world_manager.get_unit_from_pool()
	unit.position = world_manager.tile_map.map_to_local(pos)
	unit.set("race", race)
	if not unit.get_parent():
		world_manager.add_child(unit)
	var u_list = world_manager.get("units")
	if u_list != null and not u_list.has(unit):
		u_list.append(unit)

func apply_rain(pos):
	var biome = world_manager.get_tile_biome(pos)
	if biome == 7: # DESERT
		world_manager.set_tile(pos.x, pos.y, 3)
	elif biome == 14: # WASTELAND
		world_manager.set_tile(pos.x, pos.y, 3)

func apply_fire(pos):
	if world_manager.has_method("start_fire"):
		world_manager.start_fire(pos)

func apply_nuke(pos):
	world_manager.set_tile(pos.x, pos.y, 14)
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 50)
	for unit in affected_units:
		if unit.has_method("die"):
			unit.die()

func apply_lightning(pos):
	var world_pos = world_manager.tile_map.map_to_local(pos)
	var affected_units = world_manager.get_units_in_range(world_pos, 20)
	for unit in affected_units:
		if unit.has_method("take_damage"):
			unit.take_damage(100)
