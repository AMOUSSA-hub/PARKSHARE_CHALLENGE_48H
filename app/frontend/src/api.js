/**
 * Parkshare API Service
 * Centralise tous les appels vers le backend FastAPI.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function fetchZones(filters = {}) {
  const params = {};
  if (filters.departement) params.departement = filters.departement;
  if (filters.scoreMin) params.score_min = filters.scoreMin;
  if (filters.scoreMax) params.score_max = filters.scoreMax;
  if (filters.categorie) params.categorie = filters.categorie;
  if (filters.search) params.search = filters.search;
  if (filters.limit) params.limit = filters.limit;
  if (filters.sortBy) params.sort_by = filters.sortBy;
  if (filters.sortOrder) params.sort_order = filters.sortOrder;

  const { data } = await api.get('/zones', { params });
  return data;
}

export async function fetchZoneDetail(codeCommune) {
  const { data } = await api.get(`/zone/${codeCommune}`);
  return data;
}

export async function fetchKpis() {
  const { data } = await api.get('/kpis');
  return data;
}

export async function fetchDepartements() {
  const { data } = await api.get('/departements');
  return data;
}

export async function fetchDistribution() {
  const { data } = await api.get('/distribution');
  return data;
}

export async function fetchCorrelation() {
  const { data } = await api.get('/correlation');
  return data;
}
