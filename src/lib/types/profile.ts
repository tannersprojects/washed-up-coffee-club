// Profile type matching the database schema
export interface Profile {
	id: string;
	firstname: string;
	lastname: string;
	username: string;
	stravaAthleteId: number | null;
	updatedAt: Date;
}
