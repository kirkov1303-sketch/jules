extends Node

# class_name NetworkManager (Using preload to avoid circularity issues)

var peer = ENetMultiplayerPeer.new()
const PORT = 7000

func host_game():
	peer.create_server(PORT, 4)
	multiplayer.multiplayer_peer = peer
	multiplayer.peer_connected.connect(_on_peer_connected)
	print("Hosting on ", PORT)

func join_game(address: String):
	peer.create_client(address, PORT)
	multiplayer.multiplayer_peer = peer
	print("Joining ", address)

func _on_peer_connected(id):
	print("Peer connected: ", id)
	sync_world.rpc_id(id, get_node("/root/World").world_manager.serialize_world())

@rpc("authority", "call_remote", "reliable")
func sync_world(data: String):
	get_node("/root/World").world_manager.deserialize_world(data)

@rpc("any_peer", "call_remote", "unreliable")
func sync_unit_position(unit_id: int, pos: Vector2):
	# Logic to update unit position on clients
	pass

@rpc("any_peer", "call_remote", "reliable")
func apply_remote_power(power_name: String, pos: Vector2):
	get_node("/root/World").power_system.current_power = power_name
	get_node("/root/World").power_system.use_power(pos)
