import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";

// API URL configuration
const API_BASE_URL = "http://localhost:3001";

// Model interface
interface ModelInfo {
	name: string;
	path: string;
}

// Model component that loads and displays the 3D model
function Model({
	url,
	position = [0, 0, 0],
}: { url: string; position?: [number, number, number] }) {
	const { scene } = useGLTF(url);

	useEffect(() => {
		return () => {
			useGLTF.preload(url);
		};
	}, [url]);

	return <primitive object={scene} position={position} dispose={null} />;
}

// Main component
function ModelViewer() {
	// Available folders - could be fetched from an API in the future
	const availableFolders = ["aircraft", "animals", "furniture"];

	// State for folder and model selection
	const [selectedFolder, setSelectedFolder] = useState<string>("");
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

	// State for UI feedback
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch models when folder is selected
	useEffect(() => {
		if (!selectedFolder) return;

		const fetchModels = async () => {
			try {
				setLoading(true);
				setError(null);
				setSelectedModels(new Set()); // Clear selections when changing folders

				const response = await fetch(
					`${API_BASE_URL}/models/${selectedFolder}`,
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch models: ${response.statusText}`);
				}

				const data = await response.json();
				setModels(data.models);

				setLoading(false);
			} catch (err) {
				console.error("Error fetching models:", err);
				setError(err instanceof Error ? err.message : "Failed to load models");
				setLoading(false);
				setModels([]);
			}
		};

		fetchModels();
	}, [selectedFolder]);

	// Handle folder selection
	const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedFolder(e.target.value);
	};

	// Handle model selection toggle
	const toggleModelSelection = (modelPath: string) => {
		const newSelection = new Set(selectedModels);

		if (newSelection.has(modelPath)) {
			newSelection.delete(modelPath);
		} else {
			newSelection.add(modelPath);
		}

		setSelectedModels(newSelection);
	};

	// Select or deselect all models
	const handleSelectAll = (select: boolean) => {
		if (select) {
			const allPaths = new Set(models.map((model) => model.path));
			setSelectedModels(allPaths);
		} else {
			setSelectedModels(new Set());
		}
	};

	// Calculate model positions in a grid layout
	const calculatePosition = (index: number): [number, number, number] => {
		const gridSize = Math.ceil(Math.sqrt(selectedModels.size));
		const spacing = 2; // Distance between models

		const row = Math.floor(index / gridSize);
		const col = index % gridSize;

		return [
			(col - (gridSize - 1) / 2) * spacing,
			0,
			(row - (gridSize - 1) / 2) * spacing,
		];
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				padding: "20px",
			}}
		>
			<div style={{ marginBottom: "20px" }}>
				<h2>3D Model Viewer</h2>

				{/* Folder selection */}
				<div style={{ marginBottom: "10px" }}>
					<label htmlFor="folder-select" style={{ marginRight: "10px" }}>
						Select Folder:
					</label>
					<select
						id="folder-select"
						value={selectedFolder}
						onChange={handleFolderChange}
						style={{ padding: "8px", minWidth: "200px" }}
					>
						<option value="">-- Select a folder --</option>
						{availableFolders.map((folder) => (
							<option key={folder} value={folder}>
								{folder}
							</option>
						))}
					</select>
				</div>

				{/* Model selection */}
				{selectedFolder && (
					<div style={{ marginBottom: "10px" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "10px",
							}}
						>
							<span>Select Models:</span>
							<div>
								<button
									type="button"
									onClick={() => handleSelectAll(true)}
									style={{ marginRight: "10px", padding: "4px 8px" }}
									disabled={models.length === 0 || loading}
								>
									Select All
								</button>
								<button
									type="button"
									onClick={() => handleSelectAll(false)}
									style={{ padding: "4px 8px" }}
									disabled={selectedModels.size === 0 || loading}
								>
									Deselect All
								</button>
							</div>
						</div>

						{loading ? (
							<p>Loading models...</p>
						) : error ? (
							<p style={{ color: "red" }}>{error}</p>
						) : models.length === 0 ? (
							<p>No models found in this folder</p>
						) : (
							<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
								{models.map((model) => (
									<div
										key={model.name}
										style={{
											display: "flex",
											alignItems: "center",
											padding: "8px",
											backgroundColor: selectedModels.has(model.path)
												? "#e6f2ff"
												: "#f5f5f5",
											borderRadius: "4px",
											border: "1px solid #ddd",
										}}
									>
										<input
											type="checkbox"
											id={`model-${model.name}`}
											checked={selectedModels.has(model.path)}
											onChange={() => toggleModelSelection(model.path)}
											style={{ marginRight: "8px" }}
										/>
										<label htmlFor={`model-${model.name}`}>{model.name}</label>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{/* 3D Canvas */}
			<div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "4px" }}>
				{selectedModels.size > 0 ? (
					<Canvas
						camera={{ position: [0, 5, 10], fov: 50 }}
						style={{ background: "#f0f0f0" }}
					>
						<color attach="background" args={["#f0f0f0"]} />
						<ambientLight intensity={0.5} />
						<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
						<pointLight position={[-10, -10, -10]} />

						<Suspense fallback={null}>
							{[...selectedModels].map((modelPath, index) => (
								<Model
									key={modelPath}
									url={`${API_BASE_URL}${modelPath}`}
									position={calculatePosition(index)}
								/>
							))}
							<Environment preset="city" />
						</Suspense>

						<OrbitControls />
					</Canvas>
				) : (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							color: "#666",
						}}
					>
						{selectedFolder
							? "Select at least one model to display"
							: "Select a folder first"}
					</div>
				)}
			</div>
		</div>
	);
}

export default ModelViewer;
