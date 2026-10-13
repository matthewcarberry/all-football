import type { EuropeanQualification, EuropeanQualificationPlace, QualificationConfig } from './types.js'

export interface EuropeanQualificationInputs {
  accessListRank: number
  seasonCoefficientRank: number
  seasonAssociationCoefficient: number
  baseChampionsLeaguePlaces: number
  faCupWinnerAlreadyQualified: boolean
  eflCupWinnerAlreadyQualified: boolean
}

export function calculateAssociationSeasonCoefficient(points: number[], participatingClubCount = points.length) {
  if (participatingClubCount <= 0) return 0
  const totalPoints = points.reduce((total, pointsForClub) => total + pointsForClub, 0)
  return Math.floor((totalPoints / participatingClubCount) * 1000) / 1000
}

export function deriveEuropeanQualification(inputs: EuropeanQualificationInputs): EuropeanQualification {
  const europeanPerformanceSpot = inputs.seasonCoefficientRank <= 2
  const championsLeaguePlaces = inputs.baseChampionsLeaguePlaces + (europeanPerformanceSpot ? 1 : 0)
  const europaLeaguePlaces = 1 + (inputs.faCupWinnerAlreadyQualified ? 1 : 0)
  const conferenceLeaguePlaces = inputs.eflCupWinnerAlreadyQualified ? 1 : 0
  const places: EuropeanQualificationPlace[] = []

  if (championsLeaguePlaces > 0) places.push({ competition: 'champions', fromPosition: 1, toPosition: championsLeaguePlaces })
  if (europaLeaguePlaces > 0) {
    const fromPosition = championsLeaguePlaces + 1
    places.push({ competition: 'europa', fromPosition, toPosition: fromPosition + europaLeaguePlaces - 1 })
  }
  if (conferenceLeaguePlaces > 0) {
    const fromPosition = (places.at(-1)?.toPosition ?? 0) + 1
    places.push({ competition: 'conference', fromPosition, toPosition: fromPosition + conferenceLeaguePlaces - 1 })
  }

  return {
    accessListRank: inputs.accessListRank,
    seasonCoefficientRank: inputs.seasonCoefficientRank,
    seasonAssociationCoefficient: inputs.seasonAssociationCoefficient,
    europeanPerformanceSpot,
    places,
    note: europeanPerformanceSpot
      ? 'Projected league places include the UEFA European Performance Spot. Domestic cup reallocations are applied when the cup winners already qualify through the league.'
      : 'Projected league places use the current UEFA access list. Domestic cup reallocations are applied when the cup winners already qualify through the league.',
  }
}

export function toQualificationConfig(qualification: EuropeanQualification): QualificationConfig {
  return {
    bands: [
      ...qualification.places.map((place) => ({ id: place.competition, label: place.competition === 'champions' ? 'Champions League' : place.competition === 'europa' ? 'Europa League' : 'Conference League', fromPosition: place.fromPosition, toPosition: place.toPosition, tone: place.competition })),
      { id: 'relegation', label: 'Relegation', fromPosition: 18, toPosition: 20, tone: 'relegation' },
    ],
    note: qualification.note,
  }
}
