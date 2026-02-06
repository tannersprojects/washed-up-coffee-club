import type { AdminServerData } from './context.js';

type MemoryRow = AdminServerData['memories'][number];

export class MemoryAdmin {
	id: string;
	src: string;
	caption: string;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;

	constructor(row: MemoryRow) {
		this.id = row.id;
		this.src = row.src;
		this.caption = row.caption;
		this.sortOrder = row.sortOrder;
		this.isActive = row.isActive;
		this.createdAt = row.createdAt;
		this.updatedAt = row.updatedAt;
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
