import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
// ModelViewer.tsx
import { Suspense, useEffect, useState } from "react";

// Model component that loads and displays the 3D model
function Model({ url }: { url: string }) {
	const { scene } = useGLTF(url);

	// Clone the scene to avoid issues with multiple instances
	// and prepare it for rendering
	useEffect(() => {
		// Optional transformations if needed
		// scene.scale.set(1, 1, 1);
		// scene.position.set(0, 0, 0);
		// scene.rotation.set(0, 0, 0);

		return () => {
			// Clean up resources when component unmounts
			useGLTF.preload(url);
		};
	}, [scene, url]);

	return <primitive object={scene} dispose={null} />;
}

// Main component
function ModelViewer() {
	const [modelUrl, setModelUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchModel = async () => {
			try {
				setLoading(true);

				// Fetch from our API endpoint
				const apiUrl = "https://react-three-api.onrender.com/model";

				// Create URL for the model
				// Using direct URL instead of fetching the binary and creating blob
				// React Three Fiber's useGLTF can load directly from URL
				setModelUrl(apiUrl);
				setLoading(false);
			} catch (err) {
				console.error("Error fetching model:", err);
				setError("Failed to load 3D model");
				setLoading(false);
			}
		};

		fetchModel();
	}, []);

	if (loading) {
		return <div>Loading model...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div style={{ width: "100%", height: "80vh" }}>
			<Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
				<color attach="background" args={["#f0f0f0"]} />
				<ambientLight intensity={0.5} />
				<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
				<pointLight position={[-10, -10, -10]} />

				<Suspense fallback={null}>
					{modelUrl && (
						<Center>
							<Model url={modelUrl} />
						</Center>
					)}
					<Environment preset="city" />
				</Suspense>

				<OrbitControls />
			</Canvas>
		</div>
	);
}

export default ModelViewer;
