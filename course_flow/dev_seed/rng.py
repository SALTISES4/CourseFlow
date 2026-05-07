"""Deterministic pseudo-random helpers (structure + Faker both keyed by seed)."""

from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass(frozen=True)
class SeededRNG:
    """All structural randomness goes through this instance."""

    seed: int
    _rng: random.Random

    @classmethod
    def from_seed(cls, seed: int) -> SeededRNG:
        return cls(seed=seed, _rng=random.Random(seed))

    def randint(self, a: int, b: int) -> int:
        return self._rng.randint(a, b)

    def choice(self, seq: list):
        return self._rng.choice(seq)

    def shuffle(self, seq: list) -> None:
        self._rng.shuffle(seq)

    def random(self) -> float:
        return self._rng.random()

    def sample(self, population: list, k: int) -> list:
        return self._rng.sample(population, k)
