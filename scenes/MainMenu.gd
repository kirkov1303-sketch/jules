extends Control

func _ready():
	$VBoxContainer/NewWorld.pressed.connect(_on_new_world_pressed)
	$VBoxContainer/LoadWorld.pressed.connect(_on_load_world_pressed)
	$VBoxContainer/Multiplayer.pressed.connect(_on_multiplayer_pressed)
	$VBoxContainer/JoinGame.pressed.connect(_on_join_pressed)
	$VBoxContainer/Quit.pressed.connect(_on_quit_pressed)

func _on_new_world_pressed():
	Global.set("is_multiplayer", false)
	get_tree().change_scene_to_file("res://scenes/World.tscn")

func _on_load_world_pressed():
	pass

func _on_multiplayer_pressed():
	Global.set("is_multiplayer", true)
	Global.set("is_host", true)
	get_tree().change_scene_to_file("res://scenes/World.tscn")

func _on_join_pressed():
	Global.set("is_multiplayer", true)
	Global.set("is_host", false)
	var ip = $VBoxContainer/IPInput.text
	if ip == "": ip = "127.0.0.1"
	Global.set("join_address", ip)
	get_tree().change_scene_to_file("res://scenes/World.tscn")

func _on_quit_pressed():
	get_tree().quit()
