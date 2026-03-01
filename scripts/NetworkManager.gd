extends Node

# class_name NetworkManager (Using load dynamically to avoid circularity issues)

var peer = ENetMultiplayerPeer.new()
const PORT = 7000

func host_game():
	peer.create_server(PORT, 4)
	multiplayer.multiplayer_peer = peer
	multiplayer.peer_connected.connect(_on_peer_connected)
	print("Hosting on ", PORT)

func join_game(address):
	peer.create_client(address, PORT)
	multiplayer.multiplayer_peer = peer
	print("Joining ", address)

func _on_peer_connected(id):
	print("Peer connected: ", id)
	var world = get_node_or_null("/root/World")
	if world and world.get("world_manager"):
		sync_world.rpc_id(id, world.world_manager.serialize_world())

@rpc("authority", "call_remote", "reliable")
func sync_world(data):
	var world = get_node_or_null("/root/World")
	if world and world.get("world_manager"):
		world.world_manager.deserialize_world(data)

@rpc("any_peer", "call_remote", "unreliable")
func sync_unit_position(_unit_id, _pos):
	# Logic to update unit position on clients
	pass

@rpc("any_peer", "call_remote", "reliable")
func apply_remote_power(power_name, pos):
	var world = get_node_or_null("/root/World")
	if world and world.get("power_system"):
		world.power_system.current_power = power_name
		world.power_system.use_power(pos)
