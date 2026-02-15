extends CharacterBody2D

# class_name Unit (Using preload to avoid circularity issues)

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
	ai = preload("res://scripts/UnitAI.gd").new(self)
	ai.apply_genetics()

func _process(delta):
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
	# Notify WorldManager
	var wm = get_node("/root/World/WorldManager")
	if wm:
		wm.return_unit_to_pool(self)
	else:
		queue_free()
