import type { AdminContextData } from '$lib/types/admin.js';
import { MemoryAdmin } from './MemoryAdmin.svelte.js';
import { RoutineScheduleAdmin } from './RoutineScheduleAdmin.svelte.js';
import { ChallengeAdmin } from './ChallengeAdmin.svelte.js';

export type AdminTab = 'memories' | 'schedules' | 'challenges';

export class AdminUI {
	memories: MemoryAdmin[];
	routineSchedules: RoutineScheduleAdmin[];
	challenges: ChallengeAdmin[];
	activeTab: AdminTab;

	constructor(data: AdminContextData) {
		this.memories = $state(data.memories.map((m) => new MemoryAdmin(m)));
		this.routineSchedules = $state(data.routineSchedules.map((s) => new RoutineScheduleAdmin(s)));
		this.challenges = $state(data.challenges.map((c) => new ChallengeAdmin(c)));
		this.activeTab = $state<AdminTab>('memories');
	}

	static fromServerData(data: AdminContextData): AdminUI {
		return new AdminUI(data);
	}

	updateFromServerData(data: AdminContextData) {
		this.memories = data.memories.map((m) => new MemoryAdmin(m));
		this.routineSchedules = data.routineSchedules.map((s) => new RoutineScheduleAdmin(s));
		this.challenges = data.challenges.map((c) => new ChallengeAdmin(c));
	}

	setActiveTab(tab: AdminTab) {
		this.activeTab = tab;
	}

	addMemoryOptimistic(memory: MemoryAdmin) {
		this.memories = [...this.memories, memory].sort((a, b) => a.sortOrder - b.sortOrder);
	}

	removeMemoryOptimistic(id: string) {
		this.memories = this.memories.filter((m) => m.id !== id);
	}

	addScheduleOptimistic(schedule: RoutineScheduleAdmin) {
		this.routineSchedules = [...this.routineSchedules, schedule].sort(
			(a, b) => a.sortOrder - b.sortOrder
		);
	}

	removeScheduleOptimistic(id: string) {
		this.routineSchedules = this.routineSchedules.filter((s) => s.id !== id);
	}

	addChallengeOptimistic(challenge: ChallengeAdmin) {
		this.challenges = [...this.challenges, challenge].sort(
			(a, b) => a.startDate.getTime() - b.startDate.getTime()
		);
	}

	removeChallengeOptimistic(id: string) {
		this.challenges = this.challenges.filter((c) => c.id !== id);
	}
}
