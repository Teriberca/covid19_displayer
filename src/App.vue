<script setup>
  import { RouterLink, RouterView } from 'vue-router'
  import VueApexCharts from "vue3-apexcharts"
  import { ref } from "vue"
</script>

<template>
  <div id="covid">
    <div class='header'>COVID19 DISPLAYER</div>
    <div class="main">
      <div class="leftnav">
        <input type="search" v-model="input" placeholder="Search country..." id='search'>
        <ul>
          <li @click="globalclick" class="ver">WORLD-WIDE</li>
          <li v-for='country in filteredList(input)' @click='handle_click' :ref='country.Country' class="ver">{{ country.Country }}</li>
        </ul>
      </div>
      <div class="collumn middle">
        <div class="show_global" v-if="world">
          <h2 class="title">Global</h2>
          <ul class="basic">
            <li class='hor'>NewConfirmed: {{ format(global.NewConfirmed) }}</li>
            <li class='hor'>TotalConfirmed: {{ format(global.TotalConfirmed) }}</li>
            <li class='hor'>NewDeaths: {{ format(global.NewDeaths) }}</li>
            <li class='hor'>TotalDeaths: {{ format(global.TotalDeaths) }}</li>
          </ul>
          <select v-model="selected" class="selectbar">
            <option>NewConfirmed</option>
            <option>NewDeaths</option>
            <option>TotalConfirmed</option>
            <option>TotalDeaths</option>
          </select>
          <div id="date">data updated by {{ date }}</div>
          <div class="chart">
            <apexchart height="700" width="98%" type="bar" :series="series" :options='options' @dataPointSelection='chartclick'></apexchart>
            <div class="chartitle">{{selected}} Top {{top}} Countries</div>
          </div>
        </div>

        <div class="single_country" v-if="single">
          <h2 class="title">{{ selectedCountry }}</h2>
          <button @click='globalclick'>return home</button>
          <div class="basic">
            <ul>
              <li class='hor'>NewConfirmed: {{ format(found.NewConfirmed) }}</li>
              <li class='hor'>TotalConfirmed: {{ format(found.TotalConfirmed) }}</li>
              <li class='hor'>NewDeaths: {{ format(found.NewDeaths) }}</li>
              <li class='hor'>TotalDeaths: {{ format(found.TotalDeaths) }}</li>
            </ul>
            <div class="date">(data updated by {{ date }})</div>
          </div>
          <div class="chart">
            <div class="choosedate">
              <label for='startday'>start</label>
              <input type="date" name="startday" :min='minDate' v-model='startday' :max='maxDate'>
              <span>----</span>
              <label for="endday">end</label>
              <input type="date" name="endday" v-model="endday" :min='startday' :max='maxDate'>
            </div>
            
            <apexchart height='400' width='80%' type='line' :options='lineoptions' :series='lineseries' ref='chart'></apexchart>

            <div v-if='province_chart'>
              <h4 style="margin-left: 10%">provinces having most cases in last 7 days({{ this.lastseven.slice(0,10) }}----{{ this.maxDate.slice(0,10) }})</h4>
              <apexchart height='400' width='80%' type='bar' :options='baroptions' :series='barseries'></apexchart>
            </div>
            <p v-if='!province_chart'>No specific information for provinces!</p>
            
          </div>
        </div>
      </div>
    </div>
    <div class="footer">...</div>
  </div>
</template>

<script>
  export default {
    data() {
     return {
      countries: [],
      global: {
        NewConfirmed: 0,
        NewDeaths: 0,
        TotalConfirmed: 0,
        TotalDeaths: 0
      },
      selectedCountry: '',
      selected_data: [],
      found: {},
      startday: '',
      endday: '',
      minDate: '',
      maxDate: '',
      world: 1,
      single: 0,
      lastseven: '',
      input: '',
      top:10,
      selected: "NewConfirmed",
      province_chart: false,
      date: [],
      province_data: [],
      options: {
        chart: {
          events: {
            mounted: function(){
              console.log('chart mounted')
            }
          }
        },
        xaxis: {
          type:'category',
          labels: {
            style: {
              fontWeight: 'bold',
            },
          },
          offsetX: 0,
        },
        yaxis: {
          labels: {
            style: {
              fontWeight: 'bold',
              fontSize: '12px',
            },
          },
        },
        plotOptions: {
          bar: {
            distributed: true,
            horizontal: true,
            borderRadius: 5,
          },
        },
        dataLabels: {
          enabled: true,
          formatter:  this.format, 
        },
        colors: ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B', '#2b908f', '#f9a3a4', '#90ee7e','#f48024', '#69d2e7'],
      },
      lineoptions: {
        chart: {
          zoom: {
            enabled: true,
            type: 'y',
            autoScaleYaxis: true,
          }
        },
        yaxis: [{
          seriesName: 'confirmed',
          title: {
            text: 'confirmed',
          },
          opposite: true,
        },
        {
          seriesName: 'deaths',
          title: {
            text: 'deaths',
          },
        }],

        xaxis: {
          tickPlacement: 'on',
          tickAmount: 10,
          type: 'datetime',
        },
        colors: ['#4888e8','#ba3f56'],
      },
      baroptions: {
        chart: {
        },

        xaxis: {
          type: 'category',
        },

        yaxis: [{
          logarithmic: true,
          forceNiceScale: true,
        },{
          logarithmic: false,
          forceNiceScale: true,
          opposite: true,
        }],

        dataLabels: {
          enabled: false,
        },
        colors: ['#4888e8','#ba3f56'],
        plotOptions: {
          bar: {
          }
        },
      },

     } 
    },

    created() {
      this.get_data()
    },

    watch: {
      startday: function() {
        this.$refs.chart.updateOptions({
          xaxis: {
            min: new Date(this.startday).getTime()
          }
        })
      },

      endday: function() {
        this.$refs.chart.updateOptions({
          xaxis: {
            max: new Date(this.endday).getTime()
          }
        })
      },
        
    },
    computed: {
      series() {
        let converter = (
            i => ({
              x: i.Country,
              y: i[this.selected],
            })
          )

        let reverse = ((a,b) => b.y - a.y)
        let data = this.countries.map(converter).sort(reverse) 
        return [{
          name: this.selected,
          data: data.slice(0,this.top)
        }]
      },

      lineseries() {
        let confirmed = this.selected_data.map((i) => ({
          x: i.Date.slice(0,10),
          y: i.Confirmed
        }))
        let deaths = this.selected_data.map((i) => ({
          x: i.Date.slice(0,10),
          y: i.Deaths
        }))
        return [{
          name: 'confirmed',
          data: confirmed
        },
        {
          name: 'deaths',
          data: deaths
        }]
      },

      barseries() {
        let provinces = this.province_data.map(i => i.Province)
        provinces= [...new Set(provinces)].filter(pro => pro !== '')
        let province_data = this.province_data
        function getcases(date,status) {
          let cases = []
          for (let i of provinces) {
            let find = province_data.find(
              el => (el.Date == date)&& (el.Province == i)
            )
            cases.push(find[status])
          }
          return cases
        }
        
        let startConfirmCases= getcases(this.lastseven, 'Confirmed')
        let endConfirmCases= getcases(this.maxDate, 'Confirmed')
        let startDeathCases= getcases(this.lastseven, 'Deaths')
        let endDeathCases= getcases(this.maxDate, 'Deaths')

        
        function calnewCases(startCases, endCases) {
          let newCases = []
          for(let i=0; i<provinces.length; i++) {
            newCases.push(endCases[i]-startCases[i]) 
          } 
          return newCases
        }

        let newConfirmed = calnewCases(startConfirmCases, endConfirmCases)
        let newDeath = calnewCases(startDeathCases, endDeathCases)
               
        function sortdata(newCases) {
          let data = provinces.map(i => ({
            x: i,
            y: newCases[provinces.findIndex(pro => pro==i)]
          }))
          let reverse = ((a,b) => b.y - a.y)
          data = data.sort(reverse) 
          return data
        }

        newConfirmed = sortdata(newConfirmed)
        newDeath = sortdata(newDeath)
                
         
        return [{
          name: 'newConfirmedCases',
          data: newConfirmed.slice(0,this.top)
        },{
          name:'newDeathCases',
          data: newDeath.slice(0,this.top)

        }]
      },

    },


    methods: {
      get_data() {
        this.api.get('/summary')
        .then((res) => {
          let data = res.data
          this.countries = data.Countries 
          this.date = data.Date
          this.global = data.Global
        })
      },

      get_country_data(a) {
        this.api.get('total/country/'+ a)
        .then((res) => {
          let data = res.data
          this.selected_data = res.data
          this.minDate = data[0].Date
          this.maxDate = data[data.length-1].Date
          this.lastseven = data[data.length-8].Date
          this.startday = this.minDate.slice(0,10)
          this.endday = this.maxDate.slice(0,10)
        })
      },

      get_province(country,lastseven, today) {
        this.api.get('/country/'+country+'?from='+lastseven+'&to='+today)
        .then((res) => {
          this.province_data = res.data
          let provinces = this.province_data.map(i => i.Province)
          provinces= [...new Set(provinces)].filter(pro => pro != '')
          if (provinces.length !== 0) {
            this.province_chart = true
          }
          })
      },
      
      format(v) {
        let value = v.toString().split('').reverse()
        let len = value.length
        for(let i=0 ;i < (len-3)/3 ; i++) {
          value[3*i+2] = ',' + value[3*i+2]
        }
        let str=""
        for(let i=0; i<len ;i++) {
          str+=value.pop()
        }
        return str
      },

      globalclick() {
        this.world = 1
        this.single = 0 
      },

      handle_click(el) {
        this.selectedCountry = el.target.textContent
        this.changepage()
      },

      changepage() {
        this.province_chart = false
        this.world = 0
        this.single = 1
        const isSelectedCountry = (i) => i.Country == this.selectedCountry
        this.found = this.countries.find(isSelectedCountry) 
        this.get_country_data(this.found.Slug)
        this.get_province(this.found.Slug, this.lastseven, this.maxDate)
      },

      filteredList(input) {  
        return this.countries.filter((country) =>
          country.Country.toLowerCase().includes(input.toLowerCase())
          )
      },

      chartclick(event, chartContext, config) {
        this.selectedCountry =  this.series[0].data[config.dataPointIndex].x
        this.changepage()
      },

    },
  }

</script>

<style>

#app {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

.header {
  background-color: #fff2e6;
  text-align: center;
  padding: 30px;
  height: 30%;
  font-family: Tahoma;
  font-weight: bold;
  color: #8c8c8c;
  font-size: 2vw;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}
.footer {
  background-color: #F1F1F1;
  text-align: center;
  padding: 10px;
  box-sizing: border-box;
  margin-top: 20px;
}
.main {
  width: 100%;
  margin: 0;
  height: 800px;
}
.leftnav {
  float: left;
  display: inline-block;
  width: 20%; 
  background-color: #e6ecff;
  padding-top: 20px;
  overflow-y: scroll;
  height: 100%;

}
.collumn.middle {
  display: inline-block;
  width: 75%;
  padding-top: 20px;
  border-left-style: solid;
  border-left-color: #f2f2f2;
  padding-left: 20px;
  height:  100%;
  overflow-y: scroll;
}
.chart {
}
.show_global {
  padding:  15px;
}
.choosedate {
  margin-left: 15px;
  margin-bottom: 15px;
}
.selectbar {
  margin: 10px;
}
.chartitle {
  font-size: 15px;
  color: #0088cc;
}
.title {
  padding: 0;
  margin-top: 0;
}
#date {
  display: inline-block;
  margin: 10px;
}
.vue-apexcharts {
  padding: auto;
}
@media (max-width: 1024px) {
  .leftnav, .collum.middle {
    width: 100%;/*make collums stack on top of each other*/
  }
}
ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}
.basic {
  margin-top: 15px;
  margin-bottom: 30px;
  border-bottom: 2px solid;
  border-color: #d9d0d1;
}
.date {
  font-size: 10px;
  margin-left: 15px;
  margin-top: 10px;
}

li{
  height: 3em;
  text-align: center;
  font-weight: bold;
  font-size: 15px;
  box-sizing: border-box;
  padding-top: 10px;
  padding-bottom: 10px;
}
li.hor {
  display: inline;
  margin: 15px;
}
li.ver:hover {
  background-color: #ccd8ff;
}
li.active {
  color:  blue;
}
#date {
  font-size: 10px;
}

@media (min-width: 1024px) {
}
button {
  border-radius: 3px;
  background-color: white;
  border:  1px solid;
  margin-bottom: 15px;
}

#search {
  line-height: normal;
  border-radius: 5px;
  background: #fff;
  border: 1px solid #ddd;
  width: 86%;
  margin: 0 12px;
  position: relative;
  top: 5px;
  padding: 9px 12px;
  margin-bottom: 10px;
}
</style>
