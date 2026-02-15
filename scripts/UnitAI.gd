extends Node

class_name UnitAI

enum State { IDLE, WANDER, SEEK_FOOD, SEEK_SHELTER, WORK, FIGHT, REPRODUCE }

var unit: CharacterBody2D
var current_state = State.WANDER
var target_pos = Vector2.ZERO
var state_timer = 0.0

func _init(_unit: CharacterBody2D):
	unit = _unit

func update(delta: float):
	state_timer -= delta

	match current_state:
		State.IDLE:
			# Check for enemies or needs
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
			# Simple combat logic
			var enemy = find_nearest_enemy()
			if enemy:
				target_pos = enemy.position
				move_towards_target(delta)
				if unit.position.distance_to(target_pos) < 20:
					enemy.take_damage(10 * delta)
			else:
				current_state = State.IDLE
		State.REPRODUCE:
			if unit.hunger < 30:
				spawn_offspring()
				current_state = State.IDLE

func find_food_source():
	# For prototype, food is just some random spot or a specific biome
	target_pos = unit.position + Vector2(randf_range(-200, 200), randf_range(-200, 200))

func find_nearest_enemy():
	var wm = get_node("/root/World/WorldManager")
	if not wm: return null
	var units_near = wm.get_units_in_range(unit.position, 200)
	var nearest_enemy = null
	var min_dist = INF
	for other in units_near:
		if other == unit: continue
		if other.race != unit.race:
			var d = unit.position.distance_to(other.position)
			if d < min_dist:
				min_dist = d
				nearest_enemy = other
	return nearest_enemy

func spawn_offspring():
	var wm = get_node("/root/World/WorldManager")
	if not wm: return
	var offspring = wm.get_unit_from_pool()
	offspring.position = unit.position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
	offspring.race = unit.race
	offspring.traits = unit.traits.duplicate()
	if not offspring.get_parent():
		wm.add_child(offspring)
	wm.units.append(offspring)

func move_towards_target(delta: float):
	var dir = (target_pos - unit.position).normalized()
	unit.velocity = dir * unit.speed
	unit.move_and_slide()

# Genetic traits
func apply_genetics():
	if unit.traits.has("strong"):
		unit.max_health *= 1.5
		unit.health = unit.max_health
	if unit.traits.has("fast"):
		unit.speed *= 1.3
	if unit.traits.has("smart"):
		unit.intelligence = 1.5
