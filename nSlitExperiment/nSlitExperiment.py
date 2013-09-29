import math
import matplotlib.pyplot as plt

PHYSICALCONSTANTS = {
	'h': 6.626069e-34,
	'hBar': 1.05457e-34, #kg m^2/s
	'c': 3e8 #m/s
}



#all methods treat probability amplitudes as immutable

class DetectorProbability:  #sort of cementing that detector is vertical.  Whatever
	def __init__(self, y, prob):
		self.y = y
		self.prob = prob

class Point:
	def __init__(self, x, y):
		self.x = x
		self.y = y
	def distTo(self, b):
		return math.sqrt((self.x - b.x) * (self.x - b.x) + (self.y - b.y) * (self.y - b.y))
		
class Slit:
	def __init__(self, pos):
		self.pos = pos
		self.probAmp = None #assuming only one emitter, fixed probAmp

class ProbabilityAmplitude:
	def __init__(self, real, imag):
		self.real = real
		self.imag = imag
	def copy(self):
		return PA(real, imag)
	def sum(self, pAmp):
		return PA(self.real + pAmp.real, self.imag + pAmp.imag)
	def prod(self, pAmp):
		#(self.real + self.imag) * (pAmp.real + pAmp.imag)
		real = self.real * pAmp.real - self.imag * pAmp.imag
		imag = self.real * pAmp.imag + self.imag * pAmp.real
		return PA(real, imag)
	def absSqr(self):
		return self.real * self.real + self.imag * self.imag
	def mag(self):
		return math.sqrt(self.real * self.real + self.imag * self.imag)
	def printComps(self, title):
		print title + ' real: ' + str(self.real) + ', imag: ' + str(self.imag)
	def printMag(self, title):
		print title + ' mag: ' + str(self.mag())
	def printAbsSqr(self, title):
		print title + ' absSqr: ' + str(self.absSqr())
		
def PA(real, imag):
	return ProbabilityAmplitude(real, imag)
		
def P(x, y):
	return Point(x, y)
	
def pathProbAmp(wavelength, dist):
	hBar = PHYSICALCONSTANTS['hBar']
	h = PHYSICALCONSTANTS['h']
	momentum = h / wavelength
	phaseAngle = momentum * dist / hBar
	
	real = math.cos(phaseAngle) / dist
	imag = math.sin(phaseAngle) / dist #feynman lectures, vol 3, chap 3, pg 4
	return PA(real, imag)
	

def interfereToProbAmp(dest, slits, emitterWavelength, output):
	resultantAmp = PA(0, 0)
	for slit in slits:
		slitToDest = pathProbAmp(emitterWavelength, slit.pos.distTo(dest));
		totalSlitAmp = slit.probAmp.prod(slitToDest)
		resultantAmp = resultantAmp.sum(totalSlitAmp)
		
		if output:
			slit.probAmp.printComps('slit')
			slitToDest.printComps('slit to dest')
			totalSlitAmp.printComps('total')

	return resultantAmp
	
def plotProbs(detectorProbs):
	xs = []
	ys = []
	for prob in detectorProbs:
		xs.append(prob.prob)
		ys.append(prob.y)
	plt.plot(xs, ys)
	plt.show()
	
def dRange(start, stop, step):
	r = start
	while r < stop:
		yield r
		r += step
	
def runExp(slits, emitterPos, emitterFreq, detectorX, detectorY1, detectorY2):
	c = PHYSICALCONSTANTS['c']
	emitterWavelength = c / emitterFreq
	detectorProbs = [] 
	print 'running'
	for slit in slits:
		slitPos = slit.pos
		dist = slit.pos.distTo(emitterPos)
		slit.probAmp = pathProbAmp(emitterWavelength, dist);
	
	for y in dRange(min(detectorY1, detectorY2), max(detectorY1, detectorY2), abs(detectorY2 - detectorY1) / 500.):
		prob = interfereToProbAmp(P(detectorX, y), slits, emitterWavelength, False).absSqr()
		detectorProbs.append(DetectorProbability(y, prob));
	
	plotProbs(detectorProbs)

	print 'probability: ' + str(interfereToProbAmp(P(detectorX, 0), slits, emitterWavelength, True).absSqr())
	
	
#defining run

#units: all SI

def init():
	slits = [Slit(P(.1, .2)), Slit(P(.1, -.2))]
	emitterPos = P(0., 0.)
	emitterFreq = 1e9
	detectorX = 1.
	detectorY1 = 10
	detectorY2 = -10
	runExp(slits, emitterPos, emitterFreq, detectorX, detectorY1, detectorY2)
	
init()