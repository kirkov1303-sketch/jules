extends CharacterBody2D

# class_name Unit (Using load dynamically to avoid circularity issues)

@export var race = "human"
@export var speed = 50.0
@export var health = 100.0
@export var max_health = 100.0
@export var hunger = 0.0
@export var age = 0.0
@export var traits = []
@export var intelligence = 1.0

var ai
var is_possessed = false

func _ready():
	ai = load("res://scripts/UnitAI.gd").new(self)
	if ai.has_method("apply_genetics"):
		ai.apply_genetics()

func _process(delta):
	if ai:
		ai.update(delta)

	# Aging and Hunger
	age += delta * 0.01
	hunger += delta * 0.1

	if hunger > 100:
		health -= delta * 2

	if health <= 0:
		die()

func take_damage(amount):
	health -= amount
	if health <= 0:
		die()

func reset():
	health = max_health
	hunger = 0
	age = 0
	visible = true
	process_mode = PROCESS_MODE_INHERIT
	is_possessed = false

func die():
	var world = get_node_or_null("/root/World")
	if world and world.get("world_manager"):
		world.world_manager.return_unit_to_pool(self)
	else:
		queue_free()
