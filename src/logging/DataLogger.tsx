import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CircleStop, Download, FileJson, Flag, Gauge, Pause, Play, Search, SkipBack, SkipForward, Trash2 } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./logger-v1.3.css";

export type LogEventType = "knock" | "limiter" | "protection" | "traction" | "fault";

export type LogSample = {
  time: number;
  rpm: number;
  throttle: number;
  engineLoad: number;
  map: number;
  boost: number;
  afr: number;
  ignition: number;
  coolant: number;
  intakeAir: number;
  oilPressure: number;
  battery: number;
  speed: number;
  targetAfr?: number;
  fuelTrim?: number;
  knockLevel?: number;
  gear?: number;
  torqueNm?: number;
  horsepower?: number;
  events?: LogEventType[];
};

type LogMarker = {
  id: string;
  time: number;
  label: string;
};

type ChannelKey = "rpm" | "afr" | "boost" | "throttle" | "coolant" | "ignition" | "fuelTrim" | "knockLevel";
type DataLoggerProps = {
  samples: LogSample[];
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
  onInspectSample?: (sample: LogSample) => void;
};

const channels: {key:ChannelKey;label:string;unit:string;decimals:number;axis:"left"|"right"}[] = [
  {key:"rpm",label:"RPM",unit:"rpm",decimals:0,axis:"left"},
  {key:"afr",label:"AFR",unit:"",decimals:2,axis:"right"},
  {key:"boost",label:"Boost",unit:"bar",decimals:2,axis:"right"},
  {key:"throttle",label:"TPS",unit:"%",decimals:1,axis:"right"},
  {key:"coolant",label:"Coolant",unit:"°C",decimals:1,axis:"right"},
  {key:"ignition",label:"Ignition",unit:"°",decimals:1,axis:"right"},
  {key:"fuelTrim",label:"STFT",unit:"%",decimals:1,axis:"right"},
  {key:"knockLevel",label:"Knock",unit:"%",decimals:1,axis:"right"},
];

function valueOf(sample:LogSample,key:ChannelKey){ const value=sample[key]; return typeof value === "number" ? value : 0; }
function stats(samples:LogSample[],key:ChannelKey){ if(!samples.length)return {min:0,max:0,avg:0}; const v=samples.map(s=>valueOf(s,key)); return {min:Math.min(...v),max:Math.max(...v),avg:v.reduce((a,b)=>a+b,0)/v.length}; }
function fmt(sample:LogSample|null,key:ChannelKey){ if(!sample)return "—"; const c=channels.find(x=>x.key===key); if(!c)return "—"; return `${valueOf(sample,key).toFixed(c.decimals)}${c.unit?` ${c.unit}`:""}`; }

function exportJson(samples:LogSample[]){
  if(!samples.length)return;
  const blob=new Blob([JSON.stringify({application:"NEXUS ECU",formatVersion:"1.3",exportedAt:new Date().toISOString(),sampleCount:samples.length,samples},null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download=`nexus-log-${Date.now()}.json`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

export function DataLogger({samples,recording,onStart,onStop,onClear,onExport,onInspectSample}:DataLoggerProps){
  const [activeChannels,setActiveChannels]=useState<Set<ChannelKey>>(new Set(["rpm","afr","boost","throttle"]));
  const [cursorIndex,setCursorIndex]=useState(0);
  const [eventsOnly,setEventsOnly]=useState(false);
  const [playing,setPlaying]=useState(false);
  const [playbackSpeed,setPlaybackSpeed]=useState(1);
  const [markers,setMarkers]=useState<LogMarker[]>([]);
  const [followLatest,setFollowLatest]=useState(true);
  const safeIndex=samples.length?Math.min(samples.length-1,cursorIndex):0;
  const cursor=samples.length?samples[safeIndex]:null;
  const latest=samples.length?samples[samples.length-1]:null;
  const eventSamples=useMemo(()=>samples.filter(s=>(s.events?.length??0)>0),[samples]);
  const rows=useMemo(()=>(eventsOnly?eventSamples:samples).slice(-160).reverse(),[samples,eventSamples,eventsOnly]);
  const rpm=useMemo(()=>stats(samples,"rpm"),[samples]);
  const afr=useMemo(()=>stats(samples,"afr"),[samples]);
  const boost=useMemo(()=>stats(samples,"boost"),[samples]);
  const knockEvents=eventSamples.filter(s=>s.events?.includes("knock")).length;
  const protectionEvents=eventSamples.filter(s=>s.events?.includes("protection")).length;
  const toggle=(key:ChannelKey)=>setActiveChannels(previous=>{const next=new Set(previous); if(next.has(key)){if(next.size>1)next.delete(key);}else next.add(key); return next;});
  const selectSample=(sample:LogSample)=>{
    const i=samples.indexOf(sample);
    if(i>=0)setCursorIndex(i);
    onInspectSample?.(sample);
  };
  const status=recording?"RECORDING":playing?"PLAYBACK":samples.length?"LOG CAPTURED":"READY";

  useEffect(()=>{
    if(recording&&followLatest&&samples.length){
      setCursorIndex(samples.length-1);
    }
  },[recording,followLatest,samples.length]);

  useEffect(()=>{
    if(!playing||recording||samples.length<2)return;
    const interval=window.setInterval(()=>{
      setCursorIndex(previous=>{
        if(previous>=samples.length-1){
          setPlaying(false);
          return samples.length-1;
        }
        return previous+1;
      });
    },Math.max(20,100/playbackSpeed));
    return ()=>window.clearInterval(interval);
  },[playing,recording,playbackSpeed,samples.length]);

  useEffect(()=>{
    if(recording&&playing)setPlaying(false);
  },[recording,playing]);

  const addMarker=()=>{
    if(!cursor)return;
    setMarkers(previous=>[
      ...previous,
      {
        id:`marker-${Date.now()}-${previous.length}`,
        time:cursor.time,
        label:`MARKER ${previous.length+1}`,
      },
    ]);
  };

  const clearMarkers=()=>setMarkers([]);

  const jumpCursor=(delta:number)=>{
    if(!samples.length)return;
    setFollowLatest(false);
    setCursorIndex(previous=>Math.max(0,Math.min(samples.length-1,previous+delta)));
  };

  return <section className="logger-v13 panel">
    <div className="logger-v13-header"><div><span className="eyebrow">LIVE DATA & LOGGING / V6.4</span><h2>NEXUS Logging Workspace</h2><p className="profile-description">Configure channels, record sessions, place markers, replay captures and trace telemetry directly back into calibration maps.</p></div><div className={`logger-v13-state ${recording?"recording":""}`}><span className="status-dot online" />{status}</div></div>

    <div className="logger-v13-actions">
      {recording?<button className="logger-v13-button danger" onClick={onStop}><CircleStop size={15}/>STOP LOG</button>:<button className="logger-v13-button primary" onClick={onStart}><Play size={15}/>START LOG</button>}
      <button className="logger-v13-button" disabled={recording||!samples.length} onClick={()=>{onClear();setCursorIndex(0);setPlaying(false);setMarkers([])}}><Trash2 size={14}/>CLEAR</button>
      <button className="logger-v13-button" disabled={!samples.length} onClick={onExport}><Download size={14}/>EXPORT CSV</button>
      <button className="logger-v13-button" disabled={!samples.length} onClick={()=>exportJson(samples)}><FileJson size={14}/>EXPORT JSON</button>
      <div className="logger-v13-spacer"/><Session label="SAMPLES" value={samples.length.toLocaleString()}/><Session label="DURATION" value={`${(latest?.time??0).toFixed(2)} s`}/><Session label="EVENTS" value={`${eventSamples.length}`}/><Session label="MARKERS" value={`${markers.length}`}/>
    </div>

    <div className="logger-v13-channelbar"><div className="logger-v13-channel-title"><BarChart3 size={15}/>GRAPH CHANNELS</div>{channels.map(c=><button key={c.key} className={activeChannels.has(c.key)?"active":""} onClick={()=>toggle(c.key)}>{c.label}</button>)}</div>

    <div className="logger-v13-chart-shell">{!samples.length?<div className="logger-v13-empty"><Gauge size={32}/><strong>No telemetry captured</strong><span>Start a log, run the engine or a Test Bench scenario, then stop the log to analyse the pull.</span></div>:<ResponsiveContainer width="100%" height="100%"><LineChart data={samples} margin={{top:15,right:22,left:5,bottom:5}} onClick={(state)=>{const i=state?.activeTooltipIndex;if(typeof i==="number")setCursorIndex(i)}}><CartesianGrid strokeDasharray="3 3" opacity={0.16}/><XAxis dataKey="time" type="number" domain={["dataMin","dataMax"]} tickFormatter={v=>`${Number(v).toFixed(1)}s`}/><YAxis yAxisId="left" domain={[0,"auto"]} width={52}/><YAxis yAxisId="right" orientation="right" domain={["auto","auto"]} width={46}/><Tooltip labelFormatter={v=>`${Number(v).toFixed(2)} s`}/><Legend/>{channels.map(c=>activeChannels.has(c.key)?<Line key={c.key} type="monotone" yAxisId={c.axis} dataKey={c.key} name={c.label} strokeWidth={2} dot={false} isAnimationActive={false}/>:null)}{eventSamples.slice(-30).map(s=><ReferenceLine key={`event-${s.time}`} x={s.time} strokeDasharray="2 3" opacity={0.52}/>)}{markers.map(marker=><ReferenceLine key={marker.id} x={marker.time} strokeDasharray="6 3" strokeWidth={2} label={{value:marker.label,position:"insideTopRight",fontSize:8}}/>)}{cursor&&<ReferenceLine x={cursor.time} strokeWidth={2}/>}</LineChart></ResponsiveContainer>}</div>

    <div className="logger-v14-playback">
      <div className="logger-v14-playback-title">
        <Search size={14}/>
        <span>LOG PLAYBACK / CURSOR</span>
        <strong>{cursor?`${cursor.time.toFixed(2)} s`:"—"}</strong>
      </div>

      <div className="logger-v14-transport">
        <button
          disabled={!samples.length||recording}
          onClick={()=>{
            setFollowLatest(false);
            setPlaying(false);
            setCursorIndex(0);
          }}
        >
          <SkipBack size={13}/>
          START
        </button>

        <button
          disabled={!samples.length||recording}
          onClick={()=>jumpCursor(-1)}
        >
          ◀
        </button>

        <button
          className={playing?"active":""}
          disabled={!samples.length||recording}
          onClick={()=>{
            setFollowLatest(false);
            if(cursorIndex>=samples.length-1)setCursorIndex(0);
            setPlaying(value=>!value);
          }}
        >
          {playing?<Pause size={13}/>:<Play size={13}/>}
          {playing?"PAUSE":"PLAY"}
        </button>

        <button
          disabled={!samples.length||recording}
          onClick={()=>jumpCursor(1)}
        >
          ▶
        </button>

        <button
          disabled={!samples.length||recording}
          onClick={()=>{
            setPlaying(false);
            setFollowLatest(true);
            setCursorIndex(Math.max(0,samples.length-1));
          }}
        >
          <SkipForward size={13}/>
          LATEST
        </button>

        <label>
          <span>SPEED</span>
          <select
            value={playbackSpeed}
            disabled={recording}
            onChange={event=>setPlaybackSpeed(Number(event.target.value))}
          >
            <option value={0.25}>0.25×</option>
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>

        <button
          disabled={!cursor}
          onClick={addMarker}
        >
          <Flag size={13}/>
          ADD MARKER
        </button>

        <button
          disabled={!markers.length}
          onClick={clearMarkers}
        >
          CLEAR MARKERS
        </button>
      </div>

      <div className="logger-v14-scrubber">
        <input
          type="range"
          min={0}
          max={Math.max(0,samples.length-1)}
          value={safeIndex}
          disabled={!samples.length}
          onChange={event=>{
            setPlaying(false);
            setFollowLatest(false);
            setCursorIndex(Number(event.target.value));
          }}
        />

        <span>
          SAMPLE {samples.length?safeIndex+1:0} / {samples.length}
        </span>
      </div>

      {markers.length>0&&(
        <div className="logger-v14-markers">
          {markers.map(marker=>
            <button
              key={marker.id}
              onClick={()=>{
                const index=samples.findIndex(sample=>sample.time>=marker.time);
                if(index>=0){
                  setPlaying(false);
                  setFollowLatest(false);
                  setCursorIndex(index);
                }
              }}
            >
              <Flag size={10}/>
              {marker.label}
              <strong>{marker.time.toFixed(2)}s</strong>
            </button>
          )}
        </div>
      )}
    </div>

    <div className="logger-v13-cursor-grid">
      <CursorValue label="RPM" value={cursor?`${cursor.rpm.toFixed(0)} rpm`:"—"}/><CursorValue label="TPS" value={cursor?`${cursor.throttle.toFixed(1)}%`:"—"}/><CursorValue label="LOAD" value={cursor?`${cursor.engineLoad.toFixed(1)}%`:"—"}/><CursorValue label="BOOST" value={cursor?`${cursor.boost.toFixed(2)} bar`:"—"}/><CursorValue label="AFR" value={cursor?cursor.afr.toFixed(2):"—"}/><CursorValue label="TARGET AFR" value={cursor?.targetAfr!==undefined?cursor.targetAfr.toFixed(2):"—"}/><CursorValue label="STFT" value={cursor?.fuelTrim!==undefined?`${cursor.fuelTrim.toFixed(1)}%`:"—"}/><CursorValue label="IGNITION" value={cursor?`${cursor.ignition.toFixed(1)}°`:"—"}/><CursorValue label="KNOCK" value={cursor?.knockLevel!==undefined?`${cursor.knockLevel.toFixed(1)}%`:"—"}/><CursorValue label="GEAR" value={cursor?.gear!==undefined?`${cursor.gear}`:"—"}/><CursorValue label="TORQUE" value={cursor?.torqueNm!==undefined?`${cursor.torqueNm.toFixed(0)} Nm`:"—"}/><CursorValue label="POWER" value={cursor?.horsepower!==undefined?`${cursor.horsepower.toFixed(0)} hp`:"—"}/>
    </div>

    <div className="logger-v13-analysis"><AnalysisCard title="RPM" current={fmt(cursor,"rpm")} minimum={`${rpm.min.toFixed(0)} rpm`} maximum={`${rpm.max.toFixed(0)} rpm`} average={`${rpm.avg.toFixed(0)} rpm`}/><AnalysisCard title="AFR" current={fmt(cursor,"afr")} minimum={afr.min.toFixed(2)} maximum={afr.max.toFixed(2)} average={afr.avg.toFixed(2)}/><AnalysisCard title="BOOST" current={fmt(cursor,"boost")} minimum={`${boost.min.toFixed(2)} bar`} maximum={`${boost.max.toFixed(2)} bar`} average={`${boost.avg.toFixed(2)} bar`}/><div className="logger-v13-event-card"><div className="logger-v13-event-title"><AlertTriangle size={15}/>ECU EVENTS</div><Metric label="KNOCK" value={`${knockEvents}`}/><Metric label="PROTECTION" value={`${protectionEvents}`}/><Metric label="TOTAL" value={`${eventSamples.length}`}/></div></div>

    <div className="logger-v13-table-header">
      <div><span className="eyebrow">LOG REVIEW</span><h3>Telemetry Samples</h3></div>
      <div style={{display:"flex",gap:6}}>
        <button
          disabled={!cursor || !onInspectSample}
          onClick={()=>cursor&&onInspectSample?.(cursor)}
        >
          TRACE CURSOR IN MAP
        </button>
        <button className={eventsOnly?"active":""} onClick={()=>setEventsOnly(x=>!x)}>EVENTS ONLY</button>
      </div>
    </div>
    <div className="logger-v13-table-shell"><table className="logger-v13-table"><thead><tr><th>TIME</th><th>RPM</th><th>TPS</th><th>LOAD</th><th>BOOST</th><th>AFR</th><th>IGN</th><th>KNOCK</th><th>GEAR</th><th>EVENTS</th></tr></thead><tbody>{!rows.length?<tr><td colSpan={10} className="logger-v13-table-empty">No samples available.</td></tr>:rows.map((s,i)=><tr key={`${s.time}-${i}`} className={(s.events?.length??0)>0?"event":""} onClick={()=>selectSample(s)}><td>{s.time.toFixed(2)}</td><td>{s.rpm.toFixed(0)}</td><td>{s.throttle.toFixed(1)}%</td><td>{s.engineLoad.toFixed(1)}%</td><td>{s.boost.toFixed(2)}</td><td>{s.afr.toFixed(2)}</td><td>{s.ignition.toFixed(1)}°</td><td>{(s.knockLevel??0).toFixed(1)}%</td><td>{s.gear??"—"}</td><td>{s.events?.length?s.events.join(", ").toUpperCase():"—"}</td></tr>)}</tbody></table></div>
  </section>;
}

function Session({label,value}:{label:string;value:string}){return <div className="logger-v13-session"><span>{label}</span><strong>{value}</strong></div>}
function CursorValue({label,value}:{label:string;value:string}){return <div className="logger-v13-cursor-value"><span>{label}</span><strong>{value}</strong></div>}
function Metric({label,value}:{label:string;value:string}){return <div><span>{label}</span><strong>{value}</strong></div>}
function AnalysisCard({title,current,minimum,maximum,average}:{title:string;current:string;minimum:string;maximum:string;average:string}){return <div className="logger-v13-analysis-card"><h4>{title}</h4><Metric label="CURSOR" value={current}/><Metric label="MIN" value={minimum}/><Metric label="MAX" value={maximum}/><Metric label="AVG" value={average}/></div>}
