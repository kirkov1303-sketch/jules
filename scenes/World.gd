extends Node2D

# Use load() instead of preload() to avoid circularity errors during parse phase
static func get_world_manager_script(): return load("res://scripts/WorldManager.gd")
static func get_power_system_script(): return load("res://scripts/PowerSystem.gd")
static func get_network_manager_script(): return load("res://scripts/NetworkManager.gd")

var world_manager
var power_system
var network_manager
var speed_scale = 1.0
var possessed_unit = null

@onready var tile_map = $TileMap
@onready var camera = $Camera2D
@onready var speed_slider = $UI/SpeedSlider
@onready var music_player = $MusicPlayer

func _ready():
	world_manager = get_world_manager_script().new()
	world_manager.name = "WorldManager"
	world_manager.tile_map = tile_map
	add_child(world_manager)

	power_system = get_power_system_script().new(world_manager)
	add_child(power_system)

	network_manager = get_network_manager_script().new()
	add_child(network_manager)

	if Global.is_multiplayer:
		if Global.is_host:
			network_manager.host_game()
		else:
			network_manager.join_game(Global.join_address)

	world_manager.generate_world()

	speed_slider.value_changed.connect(_on_speed_changed)
	setup_procedural_music()
	setup_ui_connections()

func setup_ui_connections():
	$UI/PowerPanel/Tabs/Creation/SpawnHuman.pressed.connect(func(): power_system.current_power = "spawn_human")
	$UI/PowerPanel/Tabs/Creation/SpawnOrc.pressed.connect(func(): power_system.current_power = "spawn_orc")
	$UI/PowerPanel/Tabs/Nature/Rain.pressed.connect(func(): power_system.current_power = "rain")
	$UI/PowerPanel/Tabs/Destruction/Nuke.pressed.connect(func(): power_system.current_power = "nuke")

func _process(delta):
	handle_inputs(delta)
	world_manager.update_visible_chunks(camera.position)

func handle_inputs(delta):
	if Input.is_action_pressed("mouse_left"):
		power_system.use_power(get_global_mouse_position(), true)

	if Input.is_action_just_pressed("pause"):
		get_tree().paused = !get_tree().paused

	if Input.is_action_just_pressed("speed_up"):
		_on_speed_changed(clamp(speed_scale + 1.0, 1.0, 100.0))

	if Input.is_action_just_pressed("speed_down"):
		_on_speed_changed(clamp(speed_scale - 1.0, 1.0, 100.0))

	if Input.is_action_just_pressed("possess"):
		try_possess_at(get_global_mouse_position())

	update_camera(delta)

func update_camera(delta):
	if possessed_unit:
		camera.position = possessed_unit.position
		return

	var move_vec = Vector2.ZERO
	if Input.is_action_pressed("move_up"): move_vec.y -= 1
	if Input.is_action_pressed("move_down"): move_vec.y += 1
	if Input.is_action_pressed("move_left"): move_vec.x -= 1
	if Input.is_action_pressed("move_right"): move_vec.x += 1

	camera.position += move_vec.normalized() * 500 * delta

func try_possess_at(pos: Vector2):
	if possessed_unit:
		possessed_unit.is_possessed = false
		possessed_unit = null
		return

	var units = world_manager.get_units_in_range(pos, 20)
	if units.size() > 0:
		possessed_unit = units[0]
		possessed_unit.is_possessed = true

func _on_speed_changed(value):
	Engine.time_scale = value
	speed_scale = value

func setup_procedural_music():
	var generator = AudioStreamGenerator.new()
	generator.mix_rate = 44100
	generator.buffer_length = 0.1
	music_player.stream = generator
	music_player.play()
	fill_buffer()

func fill_buffer():
	var playback = music_player.get_stream_playback()
	var to_fill = playback.get_frames_available()
	while to_fill > 0:
		playback.push_frame(Vector2.ZERO) # Silence for now, but generator is setup
		to_fill -= 1
