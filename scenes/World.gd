extends Node2D

var world_manager: WorldManager
var power_system: PowerSystem
var network_manager: NetworkManager
var speed_scale = 1.0

@onready var tile_map = $TileMap
@onready var camera = $Camera2D
@onready var speed_slider = $UI/SpeedSlider
@onready var music_player = $MusicPlayer

func _ready():
	world_manager = WorldManager.new()
	world_manager.name = "WorldManager"
	world_manager.tile_map = tile_map
	add_child(world_manager)

	power_system = PowerSystem.new(world_manager)
	add_child(power_system)

	network_manager = NetworkManager.new()
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
	if Input.is_action_pressed("mouse_left"):
		power_system.use_power(get_global_mouse_position(), true)

	update_camera(delta)
	world_manager.update_visible_chunks(camera.position)

func update_camera(delta):
	var move_vec = Vector2.ZERO
	if Input.is_key_pressed(KEY_W): move_vec.y -= 1
	if Input.is_key_pressed(KEY_S): move_vec.y += 1
	if Input.is_key_pressed(KEY_A): move_vec.x -= 1
	if Input.is_key_pressed(KEY_D): move_vec.x += 1

	camera.position += move_vec.normalized() * 500 * delta

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
