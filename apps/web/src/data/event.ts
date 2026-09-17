export type EventSource={id:string;provider:string;publishedDate:string;url:string;localPath:string;sha256:string};
export type EventMarker={id:string;time:string;precision:'minute';sourceTime:string;title:string;kind:string;sourceId:string;notes:string};
export type AirportReport={id:string;name:string;closureListed:boolean;reopenedAt:string|null;reopeningSourceId:string|null;notes:string};
export type Chronology={sources:EventSource[];events:EventMarker[];airports:AirportReport[];closureReport:{sourceId:string;closedBy:string;actualStart:null;plannedUntil:string;notes:string}|null;limitations:string[]};
export type HimawariFrame={time:number;sourceTime:string;url:string;sourceUrl:string;sha256:string;bytes:number};
export type HimawariArchive={layer:string;provider:string;start:string;end:string;bounds:[number,number,number,number];width:number;height:number;crs:string;frames:HimawariFrame[];unavailableTimes:string[];failedRequests:{sourceTime:string;error:string}[];complete:boolean;expectedAvailableFrames:number;limitations:string;timeMeaning:string};
export function airportEvidenceAt(airport:AirportReport,chronology:Chronology,time:number):'scheduled-closure'|'reopening-reported'|'unknown'{
 if(airport.reopenedAt&&time>=Date.parse(airport.reopenedAt))return 'reopening-reported';
 if(airport.closureListed&&chronology.closureReport&&time>=Date.parse(chronology.closureReport.closedBy)&&time<Date.parse(chronology.closureReport.plannedUntil))return 'scheduled-closure';
 return 'unknown';
}

// Event occurrence time, not report-publication time: this is a retrospective view.
export function eventAtOrBefore(events:EventMarker[],time:number):EventMarker|undefined{
 return events.filter(e=>Date.parse(e.time)<=time).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time))[0];
}
export type AshArchive={complete?:boolean;expectedClockSlots?:number;processedClockSlots?:number;missingSourceScans?:{time:string;reason:string;sourceUrl:string}[];failedScans?:{time:string;error:string}[];provider:string;layer:string;frames:HimawariFrame[];bounds:[number,number,number,number];limitations:string;attribution:string;termsUrl:string;recipe:{red:string;green:string;blue:string;references:string[]}};

export type ReplayEventConfig={schemaVersion:1;id:string;volcanoId:string;title:string;timeZone:string;start:string;end:string;preferredStart:string;bounds:[number,number,number,number];presentation:{heading:string;description:string;place:string;timeZoneLabel:string;advisoryCoverageNote:string;airportSummary:string};assets:{observations:string;airportStatus:string;advisories:string;airports:string;infrared:string;ashRgb:string;timeline:string;chronology:string}};
