import type { Memory } from '$lib/db/schema';

export class MemoryAdmin {
	id: string;
	src: string;
	caption: string;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;

	constructor(memory: Memory) {
		this.id = memory.id;
		this.src = memory.src;
		this.caption = memory.caption;
		this.sortOrder = memory.sortOrder;
		this.isActive = memory.isActive;
		this.createdAt = memory.createdAt;
		this.updatedAt = memory.updatedAt;
	}

	toJSON() {
		return {
			id: this.id,
			src: this.src,
			caption: this.caption,
			sortOrder: this.sortOrder,
			isActive: this.isActive,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		};
	}
}
