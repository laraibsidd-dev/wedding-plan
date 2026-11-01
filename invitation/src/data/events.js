export const eventOrder = ['haldi-mehendi', 'nikah', 'walima'];

export const events = {
  'haldi-mehendi': {
    key: 'haldiMehendi',
    day: '2026-12-26',
    time: '19:00',
    locationKey: 'haldiMehendiLocation',
    mapUrl: 'https://maps.app.goo.gl/ZvgkCU1aGsDAmgTj9?g_st=ac',
    icon: '✿',
    tone: 'marigold'
  },
  nikah: {
    key: 'nikah',
    day: '2026-12-27',
    time: '19:00',
    locationKey: 'nikahLocation',
    mapUrl: 'https://maps.app.goo.gl/AiNt9kQasYT6XNFH7?g_st=ac',
    icon: '☾',
    tone: 'ceremony'
  },
  walima: {
    key: 'walima',
    day: '2026-12-28',
    time: '19:00',
    locationKey: 'walimaLocation',
    mapUrl: 'https://maps.app.goo.gl/xHN6aEyZ7bYG4xWq7?g_st=ac',
    icon: '✧',
    tone: 'feast'
  }
};

export const inviteChoices = ['all', ...eventOrder];
