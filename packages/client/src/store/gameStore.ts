/** Global game state store. */
import { create } from 'zustand';

interface GameState {}

export const useGameStore = create<GameState>()(() => ({}));
