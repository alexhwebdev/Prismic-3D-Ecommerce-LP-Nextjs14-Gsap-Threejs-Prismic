"use client";

import * as THREE from "three";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";

// Using Object3D as a container to efficiently set and update positions for each bubble instance
// THREE.Object3D() used as a temporary transformation helper.
const threeDObject = new THREE.Object3D();

// Customizations in case you want to use this in other scenes.
export function Bubbles({
  count = 300,
  speed = 5,
  bubbleSize = 0.05,
  opacity = 0.5,
  repeat = true,
}) {
  // InstancedMesh : optimized way to render multiple objects efficiently.
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // An array that holds all of our bubbles' speeds
  const bubbleSpeed = useRef(new Float32Array(count));
  const minSpeed = speed * 0.001;
  const maxSpeed = speed * 0.005;

  // Create geometry and material for our mesh
  // (radius, widthSegments, heightSegments)
  // Higher the segment, rounder the sphere
  const geometry = new THREE.SphereGeometry(bubbleSize, 16, 16);

  const material = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity,
  });
  
  // INITAIL PLACEMENT
  // Runs once to create and place our bubbles
  useEffect(() => {
    // Access the instanced mesh
    const mesh = meshRef.current;
    console.log('mesh ', mesh)
    if (!mesh) {
      return;
    }

    // Create {count} number of bubbles in random locations
    for (let i = 0; i < count; i++) {
      threeDObject.position.set(
        gsap.utils.random(-4, 4), // random # b/n -4 to 4
        gsap.utils.random(-4, 4),
        gsap.utils.random(-4, 4),
      );

      // Update matrix so that the position, rotation, or scale is applied
      // Ensures new position is applied before assigning it to InstancedMesh
      // Three.js does not automatically recalculate the transformation matrix when you modify position, rotation, or scale.
      threeDObject.updateMatrix();
      // Apply the updated matrix from Object3D to the instancedMesh at index i.
      mesh.setMatrixAt(i, threeDObject.matrix);

      // Set a random bubble speed
      bubbleSpeed.current[i] = gsap.utils.random(minSpeed, maxSpeed);
    }

    // Notifies Three.js that transformation data (position, rotation, scale) of instanced mesh has changed, and needs re-rendering with updated values.
    mesh.instanceMatrix.needsUpdate = true;

    // Cleanup function that runs when component unmounts or re-renders. It frees up memory by properly disposing of Three.js objects.
    return () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    };
  }, [count, minSpeed, maxSpeed]);

  // ANIMATION. useFrame runs on every animation frame
  useFrame(() => {
    if (!meshRef.current) { return; }
    // Assign current body color to bubble so it looks natural
    material.color = new THREE.Color(document.body.style.backgroundColor);

    for (let i = 0; i < count; i++) {
      // Retrieve and update the position of each bubble:
      // 1. Gets the current transformation matrix of the i-th bubble.
      meshRef.current.getMatrixAt(i, threeDObject.matrix);
      // 2. Extracts the position from that matrix and applies it to the threeDObject.
      threeDObject.position.setFromMatrixPosition(threeDObject.matrix);

      // Move bubble upwards by its speed
      threeDObject.position.y += bubbleSpeed.current[i];
      // Reset bubble position if it moves off the top of the screen
      if (threeDObject.position.y > 4 && repeat) {
        threeDObject.position.y = -2; // Reset to bottom
        threeDObject.position.x = gsap.utils.random(-4, 4);
        threeDObject.position.z = gsap.utils.random(0, 8);
      }
      threeDObject.updateMatrix();
      meshRef.current.setMatrixAt(i, threeDObject.matrix);
    }
    // Mark the instance matrix as needing an update, so the new positions of the bubbles are rendered.
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      position={[0, 0, 0]}
      material={material}
      geometry={geometry}
    ></instancedMesh>
  );
}
