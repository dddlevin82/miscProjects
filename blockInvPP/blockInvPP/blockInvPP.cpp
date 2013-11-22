// blockInvPP.cpp : Defines the entry point for the console application.
//
#include "stdafx.h"
#include "Matrix.h"
#include <math.h>
#include <stdio.h>
#include <windows.h> 
#include <tchar.h>
#include <strsafe.h>
#define BUF_SIZE 255
using namespace std;

Matrix forwardSubCol(Matrix &coefs, Matrix &eqls) {
	Matrix xs = Matrix(eqls.rows.size(), 1);
	for (int y=0; y<coefs.rows.size(); y++) {
		double sum = 0;
		for (int x=0; x<y; x++) {
			sum += coefs.rows[y][x] * xs.rows[x][0];

		}
		xs.rows[y][0] = eqls.rows[y][0] -sum / coefs.rows[y][y];
	}
	return xs;
}

Matrix forwardSub(Matrix &coefs, Matrix &eqls) {
	Matrix xs = Matrix(coefs.rows.size(), 0);
	for (int x=0; x<eqls.rows[0].size(); x++) {
		Matrix eqlsCol = eqls.sliceCol(x);
		Matrix xsCol = forwardSubCol(coefs, eqlsCol);
		xs.appendCol(xsCol);
	}
	return xs;

}

vector<Matrix> sliceLs(Matrix coefs, int blockSize) {
	vector<Matrix> ls;
	for (int i=0; i<(int)coefs.rows.size() / blockSize; i++) {
		ls.push_back(coefs.sliceBlock(i * blockSize, i * blockSize, blockSize, blockSize));
	}
	return ls;
}

vector<Matrix> sliceRs(Matrix coefs, int blockSize) {
	vector<Matrix> rs;
	for (int i=1; i<(int)coefs.rows.size() / blockSize; i++) {
		rs.push_back(coefs.sliceBlock(i * blockSize, (i - 1) * blockSize, blockSize, blockSize));
	}
	return rs;
}

vector<Matrix> calcGs(vector<Matrix> &rs, vector<Matrix> &ls) {
	vector<Matrix> gs;
	for (int i=0; i<rs.size(); i++) {
		gs.push_back(forwardSub(ls[i+1], rs[1]));
	}
	return gs;

}

vector<Matrix> calcBis(vector<Matrix> &ls, vector<Matrix> &ansBlocks) {
	vector<Matrix> bis;
	for (int i=0; i<ls.size(); i++) {
		bis.push_back(forwardSub(ls[i], ansBlocks[i]));
	}
	return bis;
}

vector<Matrix> makeGHats(vector<Matrix> &gs, int blockSize, int bandwidth) {
	vector<Matrix> gHats;
	int firstZero = blockSize - bandwidth;
	for (int i=0; i<gs.size(); i++) {
		Matrix gHat = Matrix(blockSize, bandwidth);
		for (int y=0; y<blockSize; y++) {
			for (int x=0; x<bandwidth; x++) {
				gHat.rows[y][x] = gs[i].rows[y][firstZero + x];
			}

		}
		gHats.push_back(gHat);
	}
	return gHats;
}

vector<SplitMatrix> splitByBand(vector<Matrix> &mtx, int blockSize, int bandwidth) {
	vector<SplitMatrix> split;
	for (int i=0; i<mtx.size(); i++) {
        Matrix top = mtx[i].sliceRows(0, blockSize - bandwidth);
        Matrix bot = mtx[i].sliceRows(blockSize - bandwidth, blockSize);
		split.push_back(SplitMatrix(top, bot)); 
	}
	return split;
}

vector<Matrix> solveZsBlockInv(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs) {
	vector<Matrix> zs;
	zs.push_back(UVs[0].bottom);
	for (int i=1; i<UVs.size(); i++) {
		zs.push_back(UVs[i].bottom - MHs[i-1].bottom * zs[i-1]);
	}
	return zs;
}

vector<Matrix> assemblePrefixComponents(vector<SplitMatrix> &MHs, vector<SplitMatrix> &UVs) {
	vector<Matrix> comps;
	Matrix first = Matrix(UVs[0].bottom.rows.size() + 1, MHs[0].bottom.rows[0].size() + UVs[0].bottom.rows[0].size());
	first.populateCol(first.rows[0].size() - 1, 1);
	first.pasteIn(UVs[0].bottom, 0, MHs[0].bottom.rows[0].size());
	comps.push_back(first);
	for (int i=0; i<MHs.size(); i++) {
		Matrix compNew = Matrix(UVs[0].bottom.rows.size() + 1, MHs[0].bottom.rows[0].size() + UVs[0].bottom.rows[0].size());
		compNew.populateCol(compNew.rows[0].size() - 1, 1);
		compNew.pasteIn(MHs[i].bottom * -1, 0, 0);
		compNew.pasteIn(UVs[i + 1].bottom, 0, MHs[0].bottom.rows[0].size());
		comps.push_back(compNew);
	}
	return comps;
}

vector<Matrix> *allocateNMatrices(int n) {
    vector<Matrix> *ret = new vector<Matrix>;
    for (int i=0; i<n; i++) {
        ret->push_back(Matrix(0,0));
    }
    return ret;
}

vector<Matrix> solvePrefix(vector<Matrix> xs) {

    int n = xs.size();
    int numLevels = (int) (log((double) xs.size()) / log(2.) + .5); 
    for (int i=0; i<numLevels; i++) {
        int stepSize = (unsigned int) pow(2., i + 1);
        int lookForward = (unsigned int) pow(2., i);
        int start = pow(2., i) - 1;
        for (int j=start; j<xs.size(); j+=stepSize) {
            xs[j+lookForward] = xs[j+lookForward] * xs[j];
        }
    }

    for (int k = (unsigned int) pow(2.,n-1.); k>0; k/=2) {
        for (int i=k-1; i<n-1; i+=k) {
            xs[i+k] = xs[i+k] * xs[i];
        }
    }
	return xs;
}

vector<Matrix> solveZsPrefix(vector<SplitMatrix> MHs, vector<SplitMatrix> UVs) {
	vector<Matrix> continComponents = assemblePrefixComponents(MHs, UVs);
	vector<Matrix> prefixes = solvePrefix(continComponents);



	vector<Matrix> hProds;
	Matrix first = Matrix(UVs[0].bottom.rows.size() + 1, MHs[0].bottom.rows[0].size() + UVs[0].bottom.rows[0].size());
	first.populateCol(first.rows[0].size() - 1, 1);
	first.pasteIn(UVs[0].bottom, 0, MHs[0].bottom.rows[0].size());
	hProds.push_back(first);
	for (int i=0; i<MHs.size(); i++) {
		Matrix hNew = Matrix(UVs[0].bottom.rows.size() + 1, MHs[0].bottom.rows[0].size() + UVs[0].bottom.rows[0].size());
		hNew.populateCol(hNew.rows[0].size() - 1, 1);
		hNew.pasteIn(MHs[i].bottom * -1, 0, 0);
		hNew.pasteIn(UVs[i + 1].bottom, 0, MHs[0].bottom.rows[0].size());
		for (int j=hProds.size() - 1; j>=0; j--) {
			hNew = hNew * hProds[j];
		}
		hProds.push_back(hNew);
	}
	vector<Matrix> foo;
	return foo;
}

vector<Matrix> solveYs(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs, vector<Matrix> &zs) {
	vector<Matrix> ys;
	ys.push_back(UVs[0].top);
	for (int i=1; i<UVs.size(); i++) {
		//ys.push_back(UVs[i].top - MHs[i-1].top * zs[i-1]);
	}
	return ys;
}

Matrix solveXs(vector<Matrix> &ls, vector<Matrix> &bis, vector<Matrix> &ans, vector<Matrix> &gs, int bandwidth) {
	int blockSize = ls[0].rows.size();
	vector<Matrix> gHats = makeGHats(gs, blockSize, bandwidth);
	vector<SplitMatrix> MHs = splitByBand(gHats, blockSize, bandwidth);
	vector<SplitMatrix> UVs = splitByBand(bis, blockSize, bandwidth);
	vector<Matrix> zs = solveZsPrefix(MHs, UVs);
    /*
	//vector<Matrix> zs = solveZsBlockInv(UVs, MHs);
	vector<Matrix> ys = solveYs(UVs, MHs, zs);
	Matrix xs = Matrix(zs.size() * zs[0].rows.size() + ys.size() * ys[0].rows.size(), 1);
	int index = 0;
	for (int i=0; i<zs.size(); i++) {
		Matrix *yGroup = &ys[i];
		Matrix *zGroup = &zs[i];

		for (int row=0; row<yGroup->rows.size(); row++) {
			xs.rows[index][0] = yGroup->rows[row][0];
			index++;
		}
		for (int row=0; row<zGroup->rows.size(); row++) {
			xs.rows[index][0] = zGroup->rows[row][0];
			index++;
		}
	}
	return xs;
    */
	return gHats[0];
}


/////////////////// their stuff
//------------------------------------------
// A function to Display the message
// indicating in which tread we are
//------------------------------------------
void DisplayMessage (HANDLE hScreen, 
     char *ThreadName, int Data, int Count)
{

    TCHAR msgBuf[BUF_SIZE];
    size_t cchStringSize;
    DWORD dwChars;

    // Print message using thread-safe functions.
   // StringCchPrintf(msgBuf, BUF_SIZE, 
   //    TEXT("Executing iteration %02d of %s" 
   ///    " having data = %02d \n"), 
    //   Count, ThreadName, Data); 
    //StringCchLength(msgBuf, BUF_SIZE, &cchStringSize);
    printf("whatever I'm here");
	//WriteConsole(hScreen, msgBuf, cchStringSize, 
    //             &dwChars, NULL);
    Sleep(1000);
}

//-------------------------------------------
// A function that represents Thread number 1
//-------------------------------------------
DWORD WINAPI Thread_no_1( LPVOID lpParam ) 
{

    int     Data = 0;
    int     count = 0;
    HANDLE  hStdout = NULL;
    
    // Get Handle To screen.
    // Else how will we print?
    if( (hStdout = 
         GetStdHandle(STD_OUTPUT_HANDLE)) 
         == INVALID_HANDLE_VALUE )  
    return 1;

    // Cast the parameter to the correct
    // data type passed by callee i.e main() in our case.
    Data = *((int*)lpParam); 

    for (count = 0; count <= 4; count++ )
    {
       DisplayMessage (hStdout, "Thread_no_1", Data, count);
    }
    
    return 0; 
} 

//-------------------------------------------
// A function that represents Thread number 2
//-------------------------------------------
DWORD WINAPI Thread_no_2( LPVOID lpParam ) 
{

    int     Data = 0;
    int     count = 0;
    HANDLE  hStdout = NULL;
    
    // Get Handle To screen. Else how will we print?
    if( (hStdout = 
         GetStdHandle(STD_OUTPUT_HANDLE)) == 
         INVALID_HANDLE_VALUE )  
    return 1;

    // Cast the parameter to the correct
    // data type passed by callee i.e main() in our case.
    Data = *((int*)lpParam); 

    for (count = 0; count <= 7; count++ )
    {
      DisplayMessage (hStdout, "Thread_no_2", Data, count);
    }
    
    return 0; 
} 

//-------------------------------------------
// A function that represents Thread number 3
//-------------------------------------------
DWORD WINAPI Thread_no_3( LPVOID lpParam ) 
{
    int     Data = 0;
    int     count = 0;
    HANDLE  hStdout = NULL;

    // Get Handle To screen. Else how will we print?
    if( (hStdout = 
         GetStdHandle(STD_OUTPUT_HANDLE)) 
         == INVALID_HANDLE_VALUE )  
    return 1;

    // Cast the parameter to the correct
    // data type passed by callee i.e main() in our case.
    Data = *((int*)lpParam); 

	printf("yo yo I am here and data is %d", Data);
    
    return 0; 
} 
struct Point {
	int x;
	int y;
};
DWORD WINAPI myFunc(LPVOID lpParam) {
	Point p = *((Point*)lpParam);

	printf("lol %d\n", p.x);
	return 0;
}



int main(int argc, char *argv[])
{
/*
    // Data of Thread 1
    int Data_Of_Thread_1 = 1;
    // Data of Thread 2
    int Data_Of_Thread_2 = 2;
    // Data of Thread 3
    int Data_Of_Thread_3 = 3;
    // variable to hold handle of Thread 1
    HANDLE Handle_Of_Thread_1 = 0;
    // variable to hold handle of Thread 1 
    HANDLE Handle_Of_Thread_2 = 0;
    // variable to hold handle of Thread 1
    HANDLE Handle_Of_Thread_3 = 0;
    // Aray to store thread handles 
    HANDLE Array_Of_Thread_Handles[3];

    // Create thread 1.
    Handle_Of_Thread_1 = CreateThread( NULL, 0, 
           Thread_no_1, &Data_Of_Thread_1, 0, NULL);  
    if ( Handle_Of_Thread_1 == NULL)
        ExitProcess(Data_Of_Thread_1);
    
    // Create thread 2.
    Handle_Of_Thread_2 = CreateThread( NULL, 0, 
           Thread_no_2, &Data_Of_Thread_2, 0, NULL);  
    if ( Handle_Of_Thread_2 == NULL)
        ExitProcess(Data_Of_Thread_2);
    
    // Create thread 3.
    Handle_Of_Thread_3 = CreateThread( NULL, 0, 
           Thread_no_3, &Data_Of_Thread_3, 0, NULL);  
    if ( Handle_Of_Thread_3 == NULL)
        ExitProcess(Data_Of_Thread_3);


    // Store Thread handles in Array of Thread
    // Handles as per the requirement
    // of WaitForMultipleObjects() 
    Array_Of_Thread_Handles[0] = Handle_Of_Thread_1;
    Array_Of_Thread_Handles[1] = Handle_Of_Thread_2;
    Array_Of_Thread_Handles[2] = Handle_Of_Thread_3;
    
    // Wait until all threads have terminated.
    WaitForMultipleObjects( 3, 
        Array_Of_Thread_Handles, TRUE, INFINITE);

    printf("Since All threads executed" 
           " lets close their handles \n");

    // Close all thread handles upon completion.
    CloseHandle(Handle_Of_Thread_1);
    CloseHandle(Handle_Of_Thread_2);
    CloseHandle(Handle_Of_Thread_3);
*/
	Point p;
	p.x = 5;
	p.y = 3;
	int someData = 500;
	HANDLE handleThread1 = CreateThread(NULL, 0, myFunc, &p, 0, NULL);
	HANDLE arrayOfHandles[1];
	arrayOfHandles[0] = handleThread1;
	WaitForMultipleObjects(1, arrayOfHandles, TRUE, INFINITE);
	printf("fin");
	CloseHandle(arrayOfHandles[0]);
	int numProc = 16;
	int blockSize = 5;
	int mtxSize = numProc * blockSize;
	Matrix coefs = Matrix(mtxSize, mtxSize);
	coefs.populateDiagonal(0, 0, 1);
	coefs.populateDiagonal(1, 0, -1);
	//coefs.populateDiagonal(2, 0, -2);
	vector<Matrix> rs = sliceRs(coefs, blockSize);
	vector<Matrix> ls = sliceLs(coefs, blockSize);
	vector<Matrix> gs = calcGs(rs, ls);
	int bandwidth = 2;
	Matrix ans = Matrix(mtxSize, 1);
	ans.populateCol(0, 1);
	vector<Matrix> ansBlocks = ans.asRowBlocks(blockSize);
	vector<Matrix> bis = calcBis(ls, ansBlocks);
	Matrix xs = solveXs(ls, bis, ansBlocks, gs, bandwidth);
	return 0;
}

