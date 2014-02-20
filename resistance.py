rs = [50., 125., 200.]
rBase = 50.
vSrc = 5.
resistances = []
resistances.append(1 / sum([1/r for r in rs]))
resistances.append(1 / (1/rs[0] + 1/rs[1]))
resistances.append(1 / (1/rs[0] + 1/rs[2]))
resistances.append(1 / (1/rs[1] + 1/rs[2]))

resistances.append(1 / (1/rs[0]))
resistances.append(1 / (1/rs[1]))
resistances.append(1 / (1/rs[2]))
print resistances

voltages = []
for r in resistances:
	voltages.append(vSrc * rBase / (rBase + r))
print voltages