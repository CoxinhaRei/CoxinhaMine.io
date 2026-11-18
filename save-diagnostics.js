// Public diagnostics are a fixed allowlist. Never return Redis messages, URLs or tokens.
const CODES=new Set(['REDIS_AUTH_FAILED','REDIS_WRITE_DENIED','REDIS_RATE_LIMITED','REDIS_QUOTA_EXCEEDED','SAVE_TOO_LARGE','REDIS_UNAVAILABLE','REDIS_RESPONSE_INVALID','NETWORK_TIMEOUT','NETWORK_ERROR','SAVE_CONFLICT','SESSION_LOST','SAVE_BUSY','LOCAL_WRITE_FAILED','SAVE_FAILED']);
function redisCode(status,message){
 const text=String(message||'').toLowerCase();
 if(status===401||/wrongpass|unauthorized|invalid.*token|authentication/.test(text))return 'REDIS_AUTH_FAILED';
 if(status===403||/readonly|noperm|read.only|permission/.test(text))return 'REDIS_WRITE_DENIED';
 if(status===413||/too (big|large)|max.*(request|value).*size|size.*(exceed|limit)/.test(text))return 'SAVE_TOO_LARGE';
 if(/quota|daily.*limit|monthly.*limit|max.*requests.*(exceed|limit)|storage.*limit|out of memory|\boom\b/.test(text))return 'REDIS_QUOTA_EXCEEDED';
 if(status===429||/ratelimit|rate.limit|too many requests/.test(text))return 'REDIS_RATE_LIMITED';
 if(status>=500)return 'REDIS_UNAVAILABLE';
 return 'SAVE_FAILED';
}
function code(error){
 if(CODES.has(error?.code))return error.code;
 if(CODES.has(error?.message))return error.message;
 if(['EACCES','EPERM','EROFS','ENOSPC','ENOENT'].includes(error?.code))return 'LOCAL_WRITE_FAILED';
 if(['TimeoutError','AbortError'].includes(error?.name))return 'NETWORK_TIMEOUT';
 if(error?.name==='TypeError'&&/fetch/i.test(error.message)||['ENOTFOUND','ECONNRESET','ECONNREFUSED','EAI_AGAIN'].includes(error?.cause?.code))return 'NETWORK_ERROR';
 if(error?.message==='Banco ocupado; nova tentativa será feita.')return 'SAVE_BUSY';
 return 'SAVE_FAILED';
}
module.exports={code,redisCode};
