export interface Crime {
  persistent_id: string;
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  category: any;
  outcome_status?: any;
}
