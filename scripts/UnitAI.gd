extends RefCounted

# class_name UnitAI (Using load dynamically to avoid circularity issues)

enum State { IDLE, WANDER, SEEK_FOOD, SEEK_SHELTER, WORK, FIGHT, REPRODUCE }

var unit
var current_state = State.WANDER
var target_pos = Vector2.ZERO
var state_timer = 0.0

func _init(_unit):
	unit = _unit

func update(delta):
	if unit.get("is_possessed"):
		handle_possession_input(delta)
		return

	state_timer -= delta

	match current_state:
		State.IDLE:
			var enemy = find_nearest_enemy()
			if enemy:
				current_state = State.FIGHT
			elif unit.hunger > 70:
				current_state = State.SEEK_FOOD
			elif unit.age > 18 and randf() < 0.01:
				current_state = State.REPRODUCE
			elif state_timer <= 0:
				current_state = State.WANDER
				target_pos = unit.position + Vector2(randf_range(-100, 100), randf_range(-100, 100))
				state_timer = randf_range(2, 5)
		State.WANDER:
			move_towards_target(delta)
			if unit.position.distance_to(target_pos) < 10 or state_timer <= 0:
				current_state = State.IDLE
				state_timer = randf_range(1, 3)
		State.SEEK_FOOD:
			find_food_source()
			move_towards_target(delta)
			if unit.position.distance_to(target_pos) < 10:
				unit.hunger = 0
				current_state = State.IDLE
		State.FIGHT:
			var enemy = find_nearest_enemy()
			if enemy:
				target_pos = enemy.position
				move_towards_target(delta)
				if unit.position.distance_to(target_pos) < 20:
					if enemy.has_method("take_damage"):
						enemy.take_damage(10 * delta)
			else:
				current_state = State.IDLE
		State.REPRODUCE:
			if unit.hunger < 30:
				spawn_offspring()
				current_state = State.IDLE

func find_food_source():
	target_pos = unit.position + Vector2(randf_range(-200, 200), randf_range(-200, 200))

func find_nearest_enemy():
	var world = unit.get_node_or_null("/root/World")
	if not world: return null
	var wm = world.get("world_manager")
	if not wm: return null
	var units_near = wm.get_units_in_range(unit.position, 200)
	var nearest_enemy = null
	var min_dist = INF
	for other in units_near:
		if other == unit: continue
		if other.get("race") != unit.race:
			var d = unit.position.distance_to(other.position)
			if d < min_dist:
				min_dist = d
				nearest_enemy = other
	return nearest_enemy

func spawn_offspring():
	var world = unit.get_node_or_null("/root/World")
	if not world: return
	var wm = world.get("world_manager")
	if not wm: return
	var offspring = wm.get_unit_from_pool()
	offspring.position = unit.position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
	offspring.race = unit.race
	offspring.traits = unit.traits.duplicate()
	if not offspring.get_parent():
		wm.add_child(offspring)
	if not wm.units.has(offspring):
		wm.units.append(offspring)

func move_towards_target(delta):
	var dir = (target_pos - unit.position).normalized()
	unit.velocity = dir * unit.get("speed", 50.0)
	if unit.has_method("move_and_slide"):
		unit.move_and_slide()

func handle_possession_input(_delta):
	var move_vec = Vector2.ZERO
	if Input.is_action_pressed("move_up"): move_vec.y -= 1
	if Input.is_action_pressed("move_down"): move_vec.y += 1
	if Input.is_action_pressed("move_left"): move_vec.x -= 1
	if Input.is_action_pressed("move_right"): move_vec.x += 1

	unit.velocity = move_vec.normalized() * unit.get("speed", 50.0) * 1.5
	if unit.has_method("move_and_slide"):
		unit.move_and_slide()

func apply_genetics():
	if unit.traits.has("strong"):
		unit.max_health *= 1.5
		unit.health = unit.max_health
	if unit.traits.has("fast"):
		unit.set("speed", unit.get("speed", 50.0) * 1.3)
	if unit.traits.has("smart"):
		unit.intelligence = 1.5
