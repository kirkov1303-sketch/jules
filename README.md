# SuperWorldBox Prototype

An improved WorldBox-like god sandbox simulator built with Godot 4.x.

## How to Run

1. **Install Godot 4.x**: Download and install Godot Engine 4.2 or later.
2. **Open Project**: Launch Godot, click "Import", and select the `project.godot` file in this directory.
3. **Play**: Press **F5** (or the Play button in the top right) to start the prototype.

## Controls

- **Mouse Left**: Use selected God Power / Paint terrain.
- **WASD**: Move Camera (or Move Unit when possessed).
- **Space**: Pause/Resume simulation.
- **"+" / "-"**: Increase/Decrease simulation speed (1x - 100x).
- **"P"**: Possess/Unpossess unit under mouse cursor.
- **Mouse Wheel**: Zoom in/out (Note: zooming is handled by Camera2D's internal logic or via speed slider).

## Features

- **Procedural World Generation**: 4096x4096x grid with 20 biomes (Forest, Desert, Snow, Volcano, etc.).
- **Deep AI**: Units have hunger, age, genetics, and a state-machine AI (Wander, Eat, Fight, Reproduce).
- **Civilizations**: Kingdoms expand, build cities, and engage in diplomacy (War, Peace, Alliances).
- **God Powers**:
    - **Creation**: Spawn Humans, Orcs.
    - **Nature**: Rain (turns desert/wasteland to plains).
    - **Destruction**: Nuke (creates wasteland, kills units).
- **Optimization**: Uses **Spatial Hashing** and **Object Pooling** to support 10,000+ units.
- **Multiplayer**: High-level networking support for hosting and joining games.

## Technical Details

- **Engine**: Godot 4.x (GDScript)
- **Resolution**: 1920x1080 (Resizable)
- **Graphics**: Pixel-perfect rendering (Nearest filter, CanvasItems stretch).
- **Architecture**: Modular scripts for World Management, AI, and Power Systems.
