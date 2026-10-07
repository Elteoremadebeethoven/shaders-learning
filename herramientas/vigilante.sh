#!/bin/bash
# Vigilante: como mucho CURSO_TURNOS (2) Chrome headless (procesos principales) a la vez en el Mac del dueño.
# Si aparece uno de más (alguien se saltó el portero turnos.mjs), se termina el más nuevo y se anota en el log.
# Arrancar: nohup herramientas/vigilante.sh >/dev/null 2>&1 & disown   ·   Parar: pkill -f vigilante.sh
MAX="${CURSO_TURNOS:-2}"
LOG="$(cd "$(dirname "$0")" && pwd)/.turnos.log"
while true; do
  PIDS=$(ps -axo pid=,command= | grep "MacOS/Google Chrome " | grep -- "--headless" | grep -v -- "--type=" | grep -v grep | sort -n | awk "{print \$1}")
  N=$(echo "$PIDS" | grep -c .)
  if [ "$N" -gt "$MAX" ]; then
    EXTRA=$(echo "$PIDS" | tail -n +$((MAX + 1)))
    echo "$(date '+%F %T')	VIGILANTE	-	-	$N Chrome headless a la vez (máximo $MAX); termino los más nuevos: $EXTRA" >> "$LOG"
    for p in $EXTRA; do ps -o command= -p $p | cut -c1-300 | sed 's/^/\t\t\t\t/' >> "$LOG"; kill $p 2>/dev/null; done
  fi
  sleep 3
done
