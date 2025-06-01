"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from 'uuid';

const PLAYER_ID_KEY = 'ignight-player-id';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Get from local storage then parse stored json or return initialValue
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.log(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.log(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}

export function usePersistentPlayerId(): [string, (id: string) => void] {
  const [playerId, setPlayerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(PLAYER_ID_KEY);
      if (storedId) {
        return storedId;
      }
      const newId = uuidv4();
      localStorage.setItem(PLAYER_ID_KEY, newId);
      return newId;
    }
    return '';
  });

  useEffect(() => {
    if (playerId && typeof window !== 'undefined') {
      localStorage.setItem(PLAYER_ID_KEY, playerId);
    }
  }, [playerId]);

  const updatePlayerId = (id: string) => {
      setPlayerId(id);
  }

  return [playerId, updatePlayerId];
}