import math
PHYSICALCONSTANTS = {
	'h': 6.626069e-34,
	'hBar': 1.05457e-34
}



#all methods treat probability amplitudes as immutable

class Point:
	def __init__(self, x, y):
		self.x = x
		self.y = y

class Slit:
	def __init__(self, pos)
		self.pos = pos

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
		imag = self.imag * pAmp.imag
		return PA(real, imag)
	def absSqr(self):
		return self.real * self.real + self.imag * self.imag

def PA(real, imag):
	return ProbabilityAmplitude(real, imag)
		
def P(x, y):
	return Point(x, y)
	
def pathProbAmp(waveNumber, dist):
	hBar = PHYSICALCONSTANTS.hBar
	momentum = waveNumber * hBar
	phaseAngle = momentum * dist / hBar
	real = math.cos(phaseAngle) / dist
	imag = math.sin(phaseAngle) / dist #feynman lectures, vol 3, chap 3, pg 4
	return PA(real, imag)
	

def runExp(slits, emitterPos, emitterFreq, detectorX, detectorY1, detectorY2):
	#calc freq -> wave number
	
	
	
#defining run

#I guess 

def init():
	emitterPos = P(0, 0)
	slits = [Slit(P(
	